import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min
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
  idNacionalidad: number

  @Type(() => Number)
  @IsInt()
  idEstadoCivil: number

  @Type(() => Number)
  @IsInt()
  @Min(0)
  dependientes: number

  @IsString()
  @Length(1, 1)
  @IsIn(['M', 'F'], { message: 'Sexo debe ser M o F' })
  sexo: string

  @IsString()
  @Length(18, 18)
  @Matches(/^012[0-9]{15}$/, {
    message: 'CLABE inválida: debe empezar con 012 y tener 18 dígitos'
  })
  clabe: string

  @IsString()
  @Length(1, 500)
  urlFirma: string

  @Type(() => Number)
  @IsInt()
  idSolicitudDomiciliacion: number
}
