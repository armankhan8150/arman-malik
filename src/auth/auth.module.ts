import { Module } from '@nestjs/common';
import { AuthenticationGuard } from './guards/authentication.guard';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { UserRepository } from './repositories/user.repository';
import { AuthenticationService } from './services/authentication.service';
import { OidcTokenVerifierService } from './services/oidc-token-verifier.service';
import { RequestReplayProtectionService } from './services/request-replay-protection.service';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    OidcTokenVerifierService,
    AuthenticationService,
    RequestReplayProtectionService,
    AuthenticationGuard,
  ],
  exports: [
    AuthenticationGuard,
    AuthenticationService,
    RequestReplayProtectionService,
    UserRepository,
  ],
})
export class AuthModule {}