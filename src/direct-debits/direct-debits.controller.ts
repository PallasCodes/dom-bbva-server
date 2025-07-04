import { Body, Controller, Post } from '@nestjs/common'

import { DirectDebitsService } from './direct-debits.service'
import { SaveDirectDebitDto } from './dto/save-direct-debit.dto'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'

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
    this.directDebitsService.handleTokuWebhook(dto)
  }
}
