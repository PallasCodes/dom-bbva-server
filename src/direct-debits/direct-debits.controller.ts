import { Body, Controller, Post } from '@nestjs/common'

import { DirectDebitsService } from './direct-debits.service'
import { ValidateClabeDto } from './dto/validate-clabe.dto'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'

@Controller('direct-debits')
export class DirectDebitsController {
  constructor(private readonly directDebitsService: DirectDebitsService) {}

  @Post('validate-clabe')
  validateClabe(@Body() dto: ValidateClabeDto) {
    return this.directDebitsService.validateClabe(dto)
  }

  @Post('toku-webhook')
  tokuWebHookHandler(@Body() dto: TokuWebhookRequestDto) {
    this.directDebitsService.handleTokuWebhook(dto)
  }
}
