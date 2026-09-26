import { Injectable } from '@nestjs/common';
import {
  AuthenticatedUser,
  UserRepository,
} from '../repositories/user.repository';
import { OidcTokenVerifierService } from './oidc-token-verifier.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly tokenVerifier: OidcTokenVerifierService,
    private readonly userRepository: UserRepository,
  ) {}

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const verifiedToken = await this.tokenVerifier.verify(accessToken);

    const existingUser =
      await this.userRepository.findByAuthProviderId(
        verifiedToken.subject,
      );

    if (existingUser) {
      return existingUser;
    }

    return this.userRepository.createAuthenticatedUser({
      authProviderId: verifiedToken.subject,
    });
  }
}