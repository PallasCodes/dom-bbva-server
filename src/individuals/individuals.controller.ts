import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common'

import { ValidateCodeDto } from './dto/validate-code.dto'
import { IndividualsService } from './individuals.service'
import { NotFoundError } from 'rxjs'

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
  async sendDirectDebitSms(@Body('folios') folios: string[]) {
    const failedPromises: string[] = []
    for (let i = 0; i < folios.length; i += 50) {
      const promises: Promise<any>[] = []

      for (let j = 0; j < 50; j++) {
        const folio = folios[i + j]

        if (folio) {
          promises.push(this.individualsService.sendSms(folio))
        } else {
          break
        }
      }

      const results = await Promise.allSettled(promises)
      const rejectedResults = results.filter((result) => result.status === 'rejected')

      rejectedResults.forEach((res) => {
        // @ts-ignore
        if (res.reason instanceof NotFoundException && res.reason.response?.msg) {
          // @ts-ignore
          failedPromises.push(res.reason.response?.msg)
        }
      })
    }

    if (!failedPromises.length) {
      return {
        mensaje: {
          error: false,
          mensaje: 'SMS enviados correctamente',
          mostrar: 'TOAST'
        }
      }
    }

    return {
      mensaje: {
        error: true,
        mensaje:
          'No se pudo enviar el SMS a los siguientes folios. Puede que no exista el celular en el sistema.',
        mostrar: 'DIALOG',
        detallemensaje: failedPromises
      }
    }
  }
}
