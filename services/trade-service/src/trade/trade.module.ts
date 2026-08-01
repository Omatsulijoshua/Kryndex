import { Module } from '@nestjs/common';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { MatchingEngine } from './matching-engine';
import { LedgerService } from './ledger.service';
import { MarginService } from './margin.service';
import { MarginController } from './margin.controller';

@Module({
  controllers: [TradeController, MarginController],
  providers: [TradeService, MatchingEngine, LedgerService, MarginService],
  exports: [TradeService, MarginService],
})
export class TradeModule {}
