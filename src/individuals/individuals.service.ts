import * as fs from 'fs'
import * as path from 'path'

import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { ValidateCodeDto } from './dto/validate-code.dto'
import { DirectDebitsService } from 'src/direct-debits/direct-debits.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class IndividualsService {
  private readonly validateCut: string
  private readonly getIndividualInfo: string
  private readonly getBankInfo: string
  private readonly getLoanInfoQuery: string
  private readonly getSolDomByFolio: string
  private readonly getContactInfoByFolio: string

  private readonly directDebit: number
  private readonly bitlyToken: string

  constructor(
    private configService: ConfigService,
    private readonly sqlService: SqlService,
    @Inject(forwardRef(() => DirectDebitsService))
    private readonly directDebitsService: DirectDebitsService
  ) {
    this.directDebit = this.configService.get<string>('ENV') === 'dev' ? 4239 : 4251
    this.bitlyToken = this.configService.get<string>('BITLY_TOKEN') as string

    this.validateCut = fs.readFileSync(
      path.join(__dirname, 'queries', 'validate-cut.sql'),
      'utf8'
    )
    this.getIndividualInfo = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-individual-info.sql'),
      'utf8'
    )
    this.getBankInfo = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-bank-info.sql'),
      'utf8'
    )
    this.getLoanInfoQuery = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-loan-info.sql'),
      'utf8'
    )
    this.getSolDomByFolio = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-sol-dom-by-folio.sql'),
      'utf8'
    )
    this.getContactInfoByFolio = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-contact-info-by-folio.sql'),
      'utf8'
    )
  }

  async minifyUrl(url: string): Promise<string> {
    try {
      const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.bitlyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ long_url: url })
      })

      if (!response.ok) {
        throw new Error('Error al acortar la URL')
      }

      const data = await response.json()
      return data.link
    } catch (err) {
      throw err
    }
  }

  async sendSms(folioOrden: string) {
    try {
      const [contactInfo] = await this.sqlService.query(this.getContactInfoByFolio, {
        idTipo: 1302,
        folioOrden
      })

      const url = await this.minifyUrl(
        `https://dom-bbva.netlify.app/?folio=${folioOrden}`
      )
      const payload = {
        cellphone: contactInfo.contacto,
        msg: `Cambia tu cuenta CLABE para automatizar la domiciliación de tu crédito Intermercado ${url}`
      }

      // TODO: insert or update dbo.solicitudDomiciliacion

      await this.sqlService.query('EXEC gbplus.dbo.fn_Sms @celphone, @msg', payload)

      return {
        mensaje: {
          error: false,
          mensaje: 'SMS enviado correctamente',
          mostrar: 'TOAST'
        }
      }
    } catch (err) {
      throw new InternalServerErrorException({
        mensaje: {
          error: true,
          mensaje: 'Ocurrió un error al enviar el SMS. Vuelve a intentarlo',
          mostrar: 'DIALOG'
        }
      })
    }
  }

  async validateIndividual(dto: ValidateCodeDto) {
    const validData = await this.sqlService.query(this.validateCut, dto)

    if (!validData.length) {
      throw new UnauthorizedException('Folio o código CUT incorrecto')
    }

    const [solDom] = await this.sqlService.query(this.getSolDomByFolio, {
      folioOrden: dto.folioOrden,
      idDocumento: this.directDebit
    })

    return { message: 'Validación CUT exitosa', solDom }
  }

  async getIndividual(folioOrden: string) {
    const [individualInfo] = await this.sqlService.query(this.getIndividualInfo, {
      folioOrden
    })

    if (!individualInfo) {
      throw new NotFoundException('Cliente no encontrado')
    }

    return individualInfo
  }

  async getBank(folioOrden: string) {
    const individualInfo = await this.sqlService.query(this.getBankInfo, {
      folioOrden
    })

    return individualInfo
  }

  async getLoanInfo(folioOrden: string) {
    const [loanInfo] = await this.sqlService.query(this.getLoanInfoQuery, {
      folioOrden
    })

    if (!loanInfo) {
      throw new NotFoundException('No se encontró la información de tu folio')
    }

    return loanInfo
  }
}
