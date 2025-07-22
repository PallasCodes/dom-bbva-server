import * as fs from 'fs'
import * as path from 'path'

import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import { DirectDebitsService } from 'src/direct-debits/direct-debits.service'
import { SqlService } from '../database/sql.service'
import { ValidateCodeDto } from './dto/validate-code.dto'

@Injectable()
export class IndividualsService {
  private readonly validateCut: string
  private readonly getIndividualInfo: string
  private readonly getBankInfo: string
  private readonly getLoans: string
  private readonly getDirectDebits: string
  private readonly getContactInfoByFolio: string
  private readonly getSolicitudDom

  private readonly directDebit: number
  private readonly bitlyToken: string
  private readonly logger = new Logger()

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
    this.getLoans = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-loans.sql'),
      'utf8'
    )
    this.getDirectDebits = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-direct-debits.sql'),
      'utf8'
    )
    this.getSolicitudDom = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-solicitud-dom.sql'),
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
      this.logger.error(err)
      throw err
    }
  }

  // FIX: this should be an utilitary fn
  async sendSms(folioOrden: string) {
    try {
      const [contactInfo] = await this.sqlService.query(this.getContactInfoByFolio, {
        idTipo: 1302,
        folioOrden
      })

      if (!contactInfo || !contactInfo.contacto) {
        throw new NotFoundException({
          msg: folioOrden,
          code: 'CELLPHONE_NOT_FOUND'
        })
      }

      const url = await this.minifyUrl(
        `https://dom-bbva.netlify.app/?folio=${folioOrden}`
      )
      const payload = {
        cellphone: contactInfo.contacto,
        msg: `Cambia tu cuenta CLABE para automatizar la domiciliación de tu crédito Intermercado ${url}`
      }

      await this.sqlService.query('EXEC gbplus.dbo.fn_Sms @cellphone, @msg', payload)

      return {
        mensaje: {
          error: false,
          mensaje: 'SMS enviado correctamente',
          mostrar: 'TOAST'
        }
      }
    } catch (err) {
      throw err
    }
  }

  async validateIndividual(dto: ValidateCodeDto) {
    const validData = await this.sqlService.query(this.validateCut, dto)

    if (!validData.length) {
      throw new UnauthorizedException('Folio o código CUT incorrecto')
    }

    const directDebits = await this.sqlService.query(this.getDirectDebits, {
      idPersonaFisica: dto.idPersonaFisica,
      idDocumento: this.directDebit
    })

    const [solDom] = await this.sqlService.query(this.getSolicitudDom, {
      idPersonaFisica: dto.idPersonaFisica
    })

    return { message: 'Validación CUT exitosa', directDebits, solDom }
  }

  async getIndividual(idPersonaFisica: number) {
    const [individualInfo] = await this.sqlService.query(this.getIndividualInfo, {
      idPersonaFisica
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

  async getLoanInfo(idPersonaFisica: number) {
    const loans = await this.sqlService.query(this.getLoans, {
      idPersonaFisica
    })

    if (!loans.length) {
      throw new NotFoundException('No se encontró ningún folio')
    }

    return { loans }
  }
}
