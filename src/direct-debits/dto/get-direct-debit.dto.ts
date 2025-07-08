import { IsInt } from 'class-validator'

export class GetDirectDebitDto {
  @IsInt()
  idOrden: number
}
