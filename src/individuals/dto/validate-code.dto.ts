import { IsDate, IsNumber, isString, IsString } from 'class-validator'

export class ValidateCodeDto {
  @IsString()
  folioOrden: string

  @IsNumber()
  codigo: number

  @IsString()
  fechaNacimiento: string

  @IsNumber()
  idEstadoNacimiento: number
}
