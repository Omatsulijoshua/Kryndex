import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { MarginService } from './margin.service';

@Controller('margin')
export class MarginController {
  constructor(private readonly marginService: MarginService) {}

  @Get('account')
  async getMarginAccount(@Query('userId') userId: string) {
    return this.marginService.getMarginAccount(userId);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transfer(
    @Body() body: { userId: string; asset: string; amount: string; direction: 'SPOT_TO_MARGIN' | 'MARGIN_TO_SPOT' }
  ) {
    return this.marginService.transfer(body.userId, body.asset, body.amount, body.direction);
  }

  @Post('borrow')
  @HttpCode(HttpStatus.OK)
  async borrow(@Body() body: { userId: string; asset: string; amount: string }) {
    return this.marginService.borrow(body.userId, body.asset, body.amount);
  }

  @Post('repay')
  @HttpCode(HttpStatus.OK)
  async repay(@Body() body: { userId: string; asset: string; amount: string }) {
    return this.marginService.repay(body.userId, body.asset, body.amount);
  }

  @Post('liquidate')
  @HttpCode(HttpStatus.OK)
  async liquidate(@Body() body: { userId: string }) {
    // Expose a manual trigger for checking/running liquidation audits
    const prisma = require('@kryndex/database').prisma;
    const liquidated = await prisma.$transaction(async (tx: any) => {
      return this.marginService.checkAndLiquidate(tx, body.userId);
    });
    return { status: 'checked', liquidated };
  }
}
