import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator'

export class ValidateCodeDto {
  @IsString()
  folioOrden: string

  @IsString()
  @MinLength(4)
  @MaxLength(4)
  codigo: string

  @IsString()
  fechaNacimiento: string

  @IsNumber()
  idEstadoNacimiento: number
}
