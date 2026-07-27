import { Controller, Post, Body, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('address')
  async getOrCreateAddress(
    @Body('userId') userId: string,
    @Body('asset') asset: string,
  ) {
    return this.walletService.getOrCreateAddress(userId, asset);
  }

  @Post('deposit/simulate')
  async simulateDeposit(
    @Body('userId') userId: string,
    @Body('asset') asset: string,
    @Body('amount') amount: string,
    @Body('txHash') txHash: string,
  ) {
    return this.walletService.simulateDeposit(userId, asset, amount, txHash);
  }

  @Post('withdraw')
  async requestWithdrawal(@Body() dto: WithdrawDto) {
    return this.walletService.requestWithdrawal(dto.userId, dto.asset, dto.address, dto.amount);
  }

  @Post('withdraw/:id/approve')
  async handleWithdrawalApproval(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('reviewerId') reviewerId: string,
  ) {
    return this.walletService.handleWithdrawalApproval(id, status, reviewerId);
  }
}
