import { Module } from '@nestjs/common';
import { ObserveLogger } from '../../plugins/logger';

@Module({
  providers: [ObserveLogger],
  exports: [ObserveLogger],
})
export class LoggerModule {}
