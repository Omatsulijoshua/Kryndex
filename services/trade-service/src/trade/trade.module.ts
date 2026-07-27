import { Module } from '@nestjs/common';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { MatchingEngine } from './matching-engine';
import { LedgerService } from './ledger.service';

@Module({
  controllers: [TradeController],
  providers: [TradeService, MatchingEngine, LedgerService],
  exports: [TradeService],
})
export class TradeModule {}
