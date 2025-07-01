import { Controller, Get, Param } from '@nestjs/common'

import { DirectDebitsService } from './direct-debits.service'

@Controller('direct-debits')
export class DirectDebitsController {
  constructor(private readonly directDebitsService: DirectDebitsService) {}

  @Get('loan-info/:folioOrden')
  getLoanInfo(@Param('folioOrden') folioOrden: string) {}
}
