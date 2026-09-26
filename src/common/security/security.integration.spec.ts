import {
  Controller,
  Get,
  INestApplication,
  Module,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';


import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import {
  AuthenticatedUser,
  UserRepository,
} from '../../auth/repositories/user.repository';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { OidcTokenVerifierService } from '../../auth/services/oidc-token-verifier.service';
import { RequestReplayProtectionService } from '../../auth/services/request-replay-protection.service';
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request';

import { JsonContentTypeMiddleware } from './json-content-type.middleware';
import { RateLimitCategory } from './rate-limit/rate-limit-category';
import { RateLimit } from './rate-limit/rate-limit.decorator';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { RateLimitService } from './rate-limit/rate-limit.service';

const TEST_USER: AuthenticatedUser = {
  id: 'user-1',
  authProviderId: 'auth0|integration-user',
  email: 'integration@example.com',
  role: 'USER',
};

@Controller('integration-test')
@UseGuards(
  AuthenticationGuard,
  RateLimitGuard,
)
@RateLimit(RateLimitCategory.CHAT)
class IntegrationTestController {
  @Get()
  get(
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      userId: req.user.id,
    };
  }
}

class MockUserRepository extends UserRepository {
  async createAuthenticatedUser(): Promise<AuthenticatedUser> {
    return TEST_USER;
  }

  async findByAuthProviderId(
    authProviderId: string,
  ): Promise<AuthenticatedUser | null> {
    if (
      authProviderId ===
      TEST_USER.authProviderId
    ) {
      return TEST_USER;
    }

    return null;
  }

  async findById(
    id: string,
  ): Promise<AuthenticatedUser | null> {
    return id === TEST_USER.id
      ? TEST_USER
      : null;
  }
}

@Module({
  controllers: [IntegrationTestController],
  providers: [
    AuthenticationGuard,
    AuthenticationService,
    RateLimitGuard,
    RateLimitService,
    {
      provide: UserRepository,
      useClass: MockUserRepository,
    },
    {
      provide: OidcTokenVerifierService,
      useValue: {
        verify: jest.fn(
          async (token: string) => {
            if (token !== 'valid-token') {
              throw new Error(
                'Invalid external identity provider token',
              );
            }

            return {
              subject:
                TEST_USER.authProviderId,
              payload: {
                sub: TEST_USER.authProviderId,
                exp:
                  Math.floor(
                    Date.now() / 1000,
                  ) + 3600,
              },
            };
          },
        ),
      },
    },
    {
      provide:
        RequestReplayProtectionService,
      useValue: {
        verify: jest.fn(
          async (
            _userId: string,
            timestamp: string,
            nonce: string,
          ) => {
            if (
              !/^\d+$/.test(timestamp) ||
              nonce.length < 16
            ) {
              throw new Error(
                'Invalid request proof',
              );
            }
          },
        ),
      },
    },
  ],
})
class IntegrationTestModule {}

describe('Security integration', () => {
  let app: INestApplication;

  const timestamp = (): string =>
    Math.floor(Date.now() / 1000).toString();

  const validRequest = (
    nonce: string,
  ) =>
    request(app.getHttpServer())
      .get('/integration-test')
      .set(
        'Authorization',
        'Bearer valid-token',
      )
      .set(
        'x-request-timestamp',
        timestamp(),
      )
      .set('x-request-nonce', nonce);

  beforeEach(async () => {
    process.env.RATE_LIMIT_WINDOW_SECONDS =
      '60';
    process.env.RATE_LIMIT_CHAT_IP = '50';
    process.env.RATE_LIMIT_CHAT_USER = '2';

    const moduleRef =
      await Test.createTestingModule({
        imports: [IntegrationTestModule],
      }).compile();

    app =
      moduleRef.createNestApplication();

    app.use(
      new JsonContentTypeMiddleware().use,
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();

    delete process.env
      .RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.RATE_LIMIT_CHAT_IP;
    delete process.env.RATE_LIMIT_CHAT_USER;
  });

  it('rejects API access without an access token', async () => {
    await request(app.getHttpServer())
      .get('/integration-test')
      .set(
        'x-request-timestamp',
        timestamp(),
      )
      .set(
        'x-request-nonce',
        'nonce-with-16-chars',
      )
      .expect(401);
  });

  it('authenticates through the real authentication pipeline with the OIDC provider mocked', async () => {
    const response = await validRequest(
      'nonce-integration-01',
    ).expect(200);

    expect(response.body).toEqual({
      userId: TEST_USER.id,
    });
  });

  it('rejects an invalid external-provider token', async () => {
    await request(app.getHttpServer())
      .get('/integration-test')
      .set(
        'Authorization',
        'Bearer invalid-token',
      )
      .set(
        'x-request-timestamp',
        timestamp(),
      )
      .set(
        'x-request-nonce',
        'nonce-integration-02',
      )
      .expect(401);
  });

  it('rejects requests without the additional request proof', async () => {
    await request(app.getHttpServer())
      .get('/integration-test')
      .set(
        'Authorization',
        'Bearer valid-token',
      )
      .expect(401);
  });

  it('enforces per-user rate limiting', async () => {
    await validRequest(
      'nonce-rate-limit-001',
    ).expect(200);

    await validRequest(
      'nonce-rate-limit-002',
    ).expect(200);

    const response = await validRequest(
      'nonce-rate-limit-003',
    ).expect(429);

    expect(
      response.headers['retry-after'],
    ).toBeDefined();
  });

  it('rejects non-JSON content types for body requests', () => {
    const middleware =
      new JsonContentTypeMiddleware();

    const req = {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
      },
      is: jest.fn().mockReturnValue(false),
    } as unknown as Request;


    const next = jest.fn();

  expect(() =>
    middleware.use(
      req,
      {} as never,
      next,
    ),
  ).toThrow(
    'Content-Type must be application/json',
  );

  expect(next).not.toHaveBeenCalled();
});
});