import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

export class InvalidRequestProofError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRequestProofError';
  }
}

@Injectable()
export class RequestReplayProtectionService {
  private static readonly MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async verify(
    userId: string,
    timestampHeader: string,
    nonce: string,
    now: Date = new Date(),
  ): Promise<void> {
    const normalizedTimestamp = timestampHeader.trim();

    if (!/^\d+$/.test(normalizedTimestamp)) {
      throw new InvalidRequestProofError(
        'Request timestamp must be a Unix timestamp in seconds',
      );
    }

    const timestampSeconds = Number(normalizedTimestamp);

    if (!Number.isSafeInteger(timestampSeconds)) {
      throw new InvalidRequestProofError(
        'Request timestamp is invalid',
      );
    }

    const timestampMs = timestampSeconds * 1000;

    if (!Number.isSafeInteger(timestampMs)) {
      throw new InvalidRequestProofError(
        'Request timestamp is invalid',
      );
    }

    const timestamp = new Date(timestampMs);

    if (Number.isNaN(timestamp.getTime())) {
      throw new InvalidRequestProofError(
        'Request timestamp is invalid',
      );
    }

    const ageMs = Math.abs(
      now.getTime() - timestamp.getTime(),
    );

    if (
      ageMs >
      RequestReplayProtectionService.MAX_CLOCK_SKEW_MS
    ) {
      throw new InvalidRequestProofError(
        'Request timestamp is outside the allowed time window',
      );
    }

    const normalizedNonce = nonce.trim();

    if (
      normalizedNonce.length < 16 ||
      normalizedNonce.length > 128
    ) {
      throw new InvalidRequestProofError(
        'Request nonce must contain between 16 and 128 characters',
      );
    }

    const expiresAt = new Date(
      now.getTime() +
        RequestReplayProtectionService.MAX_CLOCK_SKEW_MS,
    );

    try {
      await this.prisma.requestNonce.create({
        data: {
          userId,
          nonce: normalizedNonce,
          expiresAt,
        },
      });
    } catch (error: unknown) {
      const isUniqueConstraintViolation =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';

      if (isUniqueConstraintViolation) {
        throw new InvalidRequestProofError(
          'Request nonce has already been used',
        );
      }

      throw error;
    }
  }
}