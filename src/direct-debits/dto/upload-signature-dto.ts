import { Type } from 'class-transformer'
import { IsInt, IsNumber, Min } from 'class-validator'

export class UploadSignatureDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  idOrden: number

  @IsInt()
  @Min(1)
  @Type(() => Number)
  idSolicitudDom: number

  @IsNumber()
  @Type(() => Number)
  latitude: number

  @IsNumber()
  @Type(() => Number)
  longitude: number
}
