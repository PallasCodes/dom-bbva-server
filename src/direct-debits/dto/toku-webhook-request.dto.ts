import { IsString, IsOptional, ValidateNested, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

class VoucherUrlDto {
  @IsString()
  pdf: string

  @IsString()
  xml: string
}

class VoucherInformationDto {
  @IsString()
  account_number: string

  @IsString()
  customer_identifier: string

  @IsString()
  receiver_institution: string

  @IsString()
  receiver_name: string

  @IsString()
  receiver_account_type: string

  @IsString()
  operation_date: string

  @IsString()
  operation_time: string

  @IsString()
  spei_id: string

  @IsString()
  signature: string

  @IsString()
  certificate_number: string

  @IsString()
  cda_chain: string

  @IsString()
  tracking_id: string
}

class BankAccountVerificationDto {
  @IsString()
  id_bank_account_verification: string

  @IsString()
  status: string

  @IsString()
  validation: string

  @IsOptional()
  @IsString()
  reason: string | null

  @IsObject()
  @ValidateNested()
  @Type(() => VoucherUrlDto)
  voucher_url: VoucherUrlDto

  @IsString()
  account_number: string

  @IsString()
  customer_identifier: string

  @IsObject()
  @ValidateNested()
  @Type(() => VoucherInformationDto)
  voucher_information: VoucherInformationDto
}

export class TokuWebhookRequestDto {
  @IsString()
  id: string

  @IsString()
  event_type: string

  @IsObject()
  @ValidateNested()
  @Type(() => BankAccountVerificationDto)
  bank_account_verification: BankAccountVerificationDto
}
