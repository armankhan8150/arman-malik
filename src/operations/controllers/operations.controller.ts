import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { GetSystemMetricsUseCase } from '../application/get-system-metrics.use-case';

@Controller()
@UseGuards(AuthenticationGuard)
export class OperationsController {
  constructor(
    private readonly getSystemMetricsUseCase: GetSystemMetricsUseCase,
  ) {}

  @Get('health')
  health(): {
    status: 'ok';
    timestamp: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  async metrics(
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Administrator privileges are required',
      );
    }

    return this.getSystemMetricsUseCase.execute({
      requesterRole: request.user.role,
    });
  }
}