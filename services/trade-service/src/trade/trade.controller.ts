import { Controller, Post, Delete, Get, Body, Param, Query } from '@nestjs/common';
import { TradeService } from './trade.service';
import { PlaceOrderDto } from './dto/order.dto';
import { MatchingEngine } from './matching-engine';
import { LedgerService } from './ledger.service';

@Controller()
export class TradeController {
  constructor(
    private readonly tradeService: TradeService,
    private readonly matchingEngine: MatchingEngine,
    private readonly ledgerService: LedgerService,
  ) {}

  @Post('orders')
  async placeOrder(@Body() dto: PlaceOrderDto) {
    return this.tradeService.placeOrder(dto);
  }

  @Delete('orders/:id')
  async cancelOrder(@Param('id') id: string) {
    return this.tradeService.cancelOrder(id);
  }

  @Get('orders')
  async getUserOrders(@Query('userId') userId: string): Promise<any[]> {
    return this.tradeService.getUserOrders(userId);
  }

  @Get('orderbook')
  async getOrderBook(@Query('symbol') symbol: string) {
    return this.matchingEngine.getOrderBook(symbol);
  }

  @Get('ledger/audit')
  async auditLedger() {
    return this.ledgerService.verifyLedgerInvariants();
  }
}
