import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { DirectDebitsService } from './direct-debits.service'
import { SaveDirectDebitDto } from './dto/save-direct-debit.dto'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { UploadSignatureDto } from './dto/upload-signature-dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'

@Controller('direct-debits')
export class DirectDebitsController {
  constructor(private readonly directDebitsService: DirectDebitsService) {}

  @Get('toku-webhook')
  tokuWebHookGetHandler() {
    return { message: 'Ok' }
  }

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

  @Post('sign/:idPersonaFisica')
  signDirectDebitDoc(@Param('idPersonaFisica') idPersonaFisica: number) {
    return this.directDebitsService.signDirectDebitDoc(idPersonaFisica)
  }

  @Post('validate-loan/:idPersonaFisica')
  validateLoan(@Param('idPersonaFisica') idPersonaFisica: number) {
    return this.directDebitsService.updateStepByIdPersonaFisica(2, idPersonaFisica)
  }

  @Get('restart-process/:cliente')
  restartProcess(@Param('cliente') cliente: number) {
    return this.directDebitsService.updateStepByIdPersonaFisica(1, +cliente)
  }

  @Get(':idPersonaFisica')
  get(@Param('idPersonaFisica') idPersonaFisica: number) {
    return this.directDebitsService.getDirectDebitByIdPersonaFisica(idPersonaFisica)
  }
}
// TODO: add resend sms
