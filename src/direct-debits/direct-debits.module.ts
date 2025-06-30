import { Module } from '@nestjs/common';
import { DirectDebitsService } from './direct-debits.service';
import { DirectDebitsController } from './direct-debits.controller';

@Module({
  controllers: [DirectDebitsController],
  providers: [DirectDebitsService],
})
export class DirectDebitsModule {}
