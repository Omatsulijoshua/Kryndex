import { Controller, All, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import axios from 'axios';

@Controller()
export class GatewayController {
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  private readonly tradeServiceUrl = process.env.TRADE_SERVICE_URL || 'http://localhost:3002';
  private readonly walletServiceUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:3003';

  @All('auth/*')
  async proxyAuthRequests(@Req() req: Request, @Res() res: Response) {
    return this.forwardRequest(this.authServiceUrl, req, res);
  }

  @All(['orders', 'orders/*', 'orderbook', 'ledger/*'])
  async proxyTradeRequests(@Req() req: Request, @Res() res: Response) {
    return this.forwardRequest(this.tradeServiceUrl, req, res);
  }

  @All(['wallet', 'wallet/*'])
  async proxyWalletRequests(@Req() req: Request, @Res() res: Response) {
    return this.forwardRequest(this.walletServiceUrl, req, res);
  }

  private async forwardRequest(targetBaseUrl: string, req: Request, res: Response) {
    const path = req.path;
    const targetUrl = `${targetBaseUrl}${path}`;

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: {
          'user-agent': req.headers['user-agent'] || '',
          'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip || '',
          'Content-Type': 'application/json',
        },
      });

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `GATEWAY_ERROR: Failed to contact internal service at ${targetBaseUrl}`,
        error: error.message,
      });
    }
  }
}
