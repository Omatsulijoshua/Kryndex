import { IsUUID, IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export class PlaceOrderDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  symbol!: string; // e.g. BTC_USDT

  @IsEnum(OrderSide)
  side!: OrderSide;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsString()
  @IsNotEmpty()
  price!: string; // Using string to prevent precision loss in transport

  @IsString()
  @IsNotEmpty()
  quantity!: string; // Using string to prevent precision loss in transport
}
