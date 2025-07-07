import { IsInt, IsNotEmpty, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class UploadSignatureDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  idOrden: number
}
