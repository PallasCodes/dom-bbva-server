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

  @Get(':idPersonaFisica')
  getIndividualInfo(@Param('idPersonaFisica') idPersonaFisica: number) {
    return this.individualsService.getIndividual(idPersonaFisica)
  }

  @Get('bank/:folioOrden')
  getBankInfo(@Param('folioOrden') folioOrden: string) {
    return this.individualsService.getBank(folioOrden)
  }

  @Get('loan/:idPersonaFisica')
  getLoanInfo(@Param('idPersonaFisica') idPersonaFisica: number) {
    return this.individualsService.getLoanInfo(idPersonaFisica)
  }

  @Post('send-sms')
  async sendDirectDebitSms(@Body('clientes') clientes: number[]) {
    return this.individualsService.sendMultipleSms(clientes)
  }
}
