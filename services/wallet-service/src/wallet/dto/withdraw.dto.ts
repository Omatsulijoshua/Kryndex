import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class WithdrawDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  asset!: string; // e.g. BTC, USDT

  @IsString()
  @IsNotEmpty()
  address!: string; // Target blockchain address

  @IsString()
  @IsNotEmpty()
  amount!: string; // Using string to prevent precision loss in transport
}
