import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetSystemMetricsUseCase } from './application/get-system-metrics.use-case';
import { OperationsController } from './controllers/operations.controller';

@Module({
  imports: [AuthModule],
  controllers: [OperationsController],
  providers: [GetSystemMetricsUseCase],
})
export class OperationsModule {}