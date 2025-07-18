import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

import { EdicomService } from './edicom.service'
import { EdicomController } from './edicom.controller'

@Module({
  imports: [HttpModule],
  providers: [EdicomService],
  controllers: [EdicomController],
  exports: [EdicomService]
})
export class EdicomModule {}
