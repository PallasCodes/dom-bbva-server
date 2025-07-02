import { IsString, Length } from 'class-validator'

export class ValidateClabeDto {
  @IsString()
  @Length(16, 18)
  clabe: string

  @IsString()
  idSocketIo: string
}
