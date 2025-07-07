import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'

import { DirectDebitsService } from './direct-debits.service'
import { SaveDirectDebitDto } from './dto/save-direct-debit.dto'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'
import { UploadSignatureDto } from './dto/upload-signature-dto'

@Controller('direct-debits')
export class DirectDebitsController {
  constructor(private readonly directDebitsService: DirectDebitsService) {}

  @Post()
  save(@Body() dto: SaveDirectDebitDto) {
    return this.directDebitsService.save(dto)
  }

  @Post('validate-clabe')
  validateClabe(@Body() dto: ValidateClabeDto) {
    return this.directDebitsService.validateClabe(dto)
  }

  @Post('toku-webhook')
  tokuWebHookHandler(@Body() dto: TokuWebhookRequestDto) {
    return this.directDebitsService.handleTokuWebhook(dto)
  }

  @Post('upload-signature')
  @UseInterceptors(FileInterceptor('file'))
  uploadSignature(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadSignatureDto
  ) {
    return this.directDebitsService.uploadSignature(file, body)
  }

  @Get('document/:idOrden')
  async getDirectDebitDocument(@Param('idOrden') idOrden: number, @Res() res: Response) {
    const pdf = await this.directDebitsService.getDirectDebitDocument(idOrden)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="reporte.pdf"'
    })
    res.send(pdf)
  }
}
