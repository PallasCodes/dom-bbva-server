import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches
} from 'class-validator'

export class SaveDirectDebitDto {
  @IsString()
  @IsNotEmpty()
  nombre1: string

  @IsString()
  @IsOptional()
  nombre2?: string

  @IsString()
  @IsNotEmpty()
  apellidoPaterno: string

  @IsString()
  @IsOptional()
  apellidoMaterno?: string

  @IsString()
  @Length(12, 13)
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, { message: 'RFC no válido' })
  rfc: string

  @IsString()
  @Length(18, 18)
  @Matches(/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, {
    message: 'CURP no válido'
  })
  curp: string

  @Type(() => Number)
  @IsInt()
  idSolicitudDomiciliacion: number
}
