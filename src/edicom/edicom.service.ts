import * as fs from 'fs'
import * as path from 'path'

import { HttpService } from '@nestjs/axios'
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as FormData from 'form-data'
import * as mime from 'mime-types'
import { firstValueFrom } from 'rxjs'

import { SqlService } from 'src/database/sql.service'
import { DocumentoEdicomDom } from 'src/types/documento-edicom-dom.interface'
import { DocumentoEdicom } from '../types/documento-edicom.interface'

@Injectable()
export class EdicomService {
  private readonly logger = new Logger(EdicomService.name)

  private readonly UUID_REGEX =
    /^[a-fA-F0-9]{9}-[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/

  private readonly urlAuth: string
  private readonly clientId: string
  private readonly username: string
  private readonly password: string
  private readonly grantType: string
  private readonly baseUrlRest: string

  private readonly saveEdicomDocDom: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly sqlService: SqlService
  ) {
    this.urlAuth = this.configService.get<string>('EDICOM_AUTH_URL') as string
    this.clientId = this.configService.get<string>('EDICOM_CLIENT_ID') as string
    this.username = this.configService.get<string>('EDICOM_USERNAME') as string
    this.password = this.configService.get<string>('EDICOM_PASSWORD') as string
    this.grantType = this.configService.get<string>('EDICOM_GRANT_TYPE') as string
    this.baseUrlRest = this.configService.get<string>('EDICOM_REST_URL') as string

    this.saveEdicomDocDom = fs.readFileSync(
      path.join(__dirname, 'queries', 'save-edicom-doc.sql'),
      'utf8'
    )
  }

  async uploadFile({
    idOrden,
    file,
    tags,
    documentName,
    documentTitle
  }: {
    idOrden: number
    file: Uint8Array<ArrayBufferLike>
    tags: string
    documentName: string
    documentTitle: string
  }): Promise<string> {
    try {
      const dirName = idOrden.toString()

      const accesstoken = await this.getAccessToken()
      await this.createFolderOrden(accesstoken, dirName)

      const doc: DocumentoEdicom = {
        documentName,
        tags,
        documentTitle
      }

      const uuid = await this.uploadDocument(accesstoken, dirName, file, doc)

      return uuid
    } catch (err) {
      console.log({ err })
      this.logger.error(err)
      throw new InternalServerErrorException(
        'Ocurrió un error al subir el archivo a Edicom'
      )
    }
  }

  private async getAccessToken(): Promise<string> {
    const fullUrl = `${this.urlAuth}?client_id=${encodeURIComponent(this.clientId)}&grant_type=${this.grantType}&username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(fullUrl, null, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      )

      return data.access_token
    } catch (error) {
      this.logger.error('Error al obtener token:', error.message)
      throw error
    }
  }

  private async createFolderOrden(token: string, dirName: string): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(this.baseUrlRest, null, {
          headers: {
            'User-Agent': 'CW',
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
            'x-edicom-storage-nodeType': 'FOLDER',
            'x-edicom-storage-documentTitle': dirName,
            'x-edicom-storage-documentName': dirName
          }
        })
      )

      return data
    } catch (error) {
      this.logger.error('Error al crear carpeta:', error.message)
      throw error
    }
  }

  private async uploadDocument(
    token: string,
    dirName: string,
    file: Uint8Array<ArrayBufferLike>,
    doc: DocumentoEdicom
  ): Promise<string> {
    const form = new FormData()
    const mimeType = mime.lookup(doc.documentName) || 'application/octet-stream'

    form.append('userfile', file, {
      filename: doc.documentName,
      contentType: mimeType
    })

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrlRest}${dirName}`, form, {
          headers: {
            ...form.getHeaders(),
            'User-Agent': 'GBPlusCreditoWebV2',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'x-edicom-storage-nodeType': 'DOCUMENT',
            'x-edicom-storage-documentTitle': doc.documentTitle,
            'x-edicom-storage-documentName': doc.documentName,
            'x-edicom-storage-mediaType': mimeType,
            'x-edicom-storage-documentType': mimeType,
            'x-edicom-storage-tags': doc.tags
          },
          maxBodyLength: Infinity
        })
      )

      if (typeof data !== 'string' || !this.UUID_REGEX.test(data)) {
        throw new BadRequestException('Error al subir archivo a edicom')
      }

      return data
    } catch (error) {
      this.logger.error('Error al subir documento:', error.message)
      throw error
    }
  }

  async saveEdicomDoc(params: DocumentoEdicomDom): Promise<void> {
    await this.sqlService.query(this.saveEdicomDocDom, params)
  }
}
