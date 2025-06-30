import { Controller } from '@nestjs/common';
import { DirectDebitsService } from './direct-debits.service';

@Controller('direct-debits')
export class DirectDebitsController {
  constructor(private readonly directDebitsService: DirectDebitsService) {}
}
