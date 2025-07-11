import { Type } from 'class-transformer'
import { IsInt, IsNumber, Min } from 'class-validator'

export class UploadSignatureDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  idOrden: number

  @IsNumber()
  @Type(() => Number)
  latitude: number

  @IsNumber()
  @Type(() => Number)
  longitude: number
}
