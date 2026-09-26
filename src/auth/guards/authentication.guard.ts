import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticationService } from '../services/authentication.service';
import {
  InvalidRequestProofError,
  RequestReplayProtectionService,
} from '../services/request-replay-protection.service';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly replayProtectionService: RequestReplayProtectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const accessToken = this.extractBearerToken(request);

    try {
      const user =
        await this.authenticationService.authenticate(accessToken);

      const timestamp = this.getRequiredHeader(
        request,
        'x-request-timestamp',
      );

      const nonce = this.getRequiredHeader(
        request,
        'x-request-nonce',
      );

      await this.replayProtectionService.verify(
        user.id,
        timestamp,
        nonce,
      );

      request.user = user;

      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof InvalidRequestProofError) {
        throw new UnauthorizedException(
          'Invalid or replayed request proof',
        );
      }

      throw new UnauthorizedException(
        'Authentication failed',
      );
    }
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Authorization header is required',
      );
    }

    const [scheme, token, ...extraParts] =
      authorization.trim().split(/\s+/);

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token ||
      extraParts.length > 0
    ) {
      throw new UnauthorizedException(
        'Authorization header must contain a valid Bearer token',
      );
    }

    return token;
  }

  private getRequiredHeader(
    request: Request,
    headerName: string,
  ): string {
    const value = request.headers[headerName];

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new UnauthorizedException(
        `${headerName} header is required`,
      );
    }

    return value.trim();
  }
}