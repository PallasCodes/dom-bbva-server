import { Body, Controller, Post } from '@nestjs/common'
import { EdicomService } from './edicom.service'
import { UploadFileDto } from './edto/upload-file.dto'

@Controller('edicom')
export class EdicomController {
  constructor(private readonly edicomService: EdicomService) {}
}
