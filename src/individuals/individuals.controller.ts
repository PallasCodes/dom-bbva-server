import { Body, Controller, Get, Param, Post } from '@nestjs/common'

import { ValidateCodeDto } from './dto/validate-code.dto'
import { IndividualsService } from './individuals.service'

@Controller('individuals')
export class IndividualsController {
  constructor(private readonly individualsService: IndividualsService) {}

  @Post('validate')
  validateIndividual(@Body() dto: ValidateCodeDto) {
    return this.individualsService.validateIndividual(dto)
  }

  @Get(':folioOrden')
  getIndividualInfo(@Param('folioOrden') folioOrden: string) {
    return this.individualsService.getIndividual(folioOrden)
  }
}
