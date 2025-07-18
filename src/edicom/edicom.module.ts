import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { EdicomService } from './edicom.service'

@Module({
  imports: [HttpModule],
  providers: [EdicomService, SqlService],
  exports: [EdicomService]
})
export class EdicomModule {}
