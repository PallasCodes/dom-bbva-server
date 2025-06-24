import { Controller, Get } from '@nestjs/common'
import { IndividualsService } from './individuals.service'

@Controller('individuals')
export class IndividualsController {
  constructor(private readonly individualsService: IndividualsService) {}

  @Get()
  getClient() {
    return this.individualsService.getClient()
  }
}
