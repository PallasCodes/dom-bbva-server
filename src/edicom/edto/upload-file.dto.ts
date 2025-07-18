import { IsInt } from 'class-validator'

export class UploadFileDto {
  @IsInt()
  idOrden: number
}
