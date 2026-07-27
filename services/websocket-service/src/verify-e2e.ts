import { spawn, ChildProcess } from 'child_process';
import { io } from 'socket.io-client';
import axios from 'axios';
import { prisma } from '@kryndex/database';
import { Decimal } from '@prisma/client/runtime/library';
import * as jwt from 'jsonwebtoken';

// Helper to wait for a service port to open
async function waitPort(port: number, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await axios.get(`http://localhost:${port}/health-check-dummy-nonexistent-path`).catch((e: any) => {
        // We just want to see if the server responds at all (even 404 is fine, means port is listening)
        if (e.response) return;
        throw e;
      });
      return true;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}

async function runE2E() {
  console.log('============================================================');
  console.log('--- STARTING KRYNDEX EXCHANGE END-TO-END QA VERIFICATION ---');
  console.log('============================================================');

  // 1. Clean Database
  console.log('Cleaning up database state...');
  await prisma.ledgerEntry.deleteMany({});
  await prisma.ledgerTransaction.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.withdrawal.deleteMany({});
  await prisma.walletAddress.deleteMany({});
  await prisma.kycApplication.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed system users
  const reserveId = '00000000-0000-0000-0000-000000000000';
  const feeId = '00000000-0000-0000-0000-000000000002';
  await prisma.user.createMany({
    data: [
      { id: reserveId, email: 'system@kryndex.internal', passwordHash: 'mock_system_hash' },
      { id: feeId, email: 'fees@kryndex.internal', passwordHash: 'mock_fee_hash' },
    ],
  });

  const children: ChildProcess[] = [];
  const env = {
    ...process.env,
    DATABASE_URL: 'postgresql://kryndex_db_user:kryndex_secure_db_pass@localhost:5433/kryndex_exchange?schema=public',
    JWT_SECRET: 'kryndex_secure_jwt_secret_phrase',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: 'kryndex_secure_redis_pass',
  };

  try {
    // 2. Launch microservices
    const services = [
      { name: 'auth-service', path: 'services/auth-service/dist/main.js', port: 3001 },
      { name: 'trade-service', path: 'services/trade-service/dist/main.js', port: 3002 },
      { name: 'wallet-service', path: 'services/wallet-service/dist/main.js', port: 3003 },
      { name: 'websocket-service', path: 'services/websocket-service/dist/main.js', port: 3004 },
      { name: 'api-gateway', path: 'services/api-gateway/dist/main.js', port: 3000 },
    ];

    for (const service of services) {
      console.log(`Starting ${service.name} process...`);
      const proc = spawn('node', [service.path], { env, shell: true });
      children.push(proc);
      
      // Pipe logs for debugging
      proc.stdout?.on('data', (data) => console.log(`[${service.name}] ${data.toString().trim()}`));
      proc.stderr?.on('data', (data) => console.error(`[${service.name}-ERR] ${data.toString().trim()}`));

      const isUp = await waitPort(service.port);
      if (!isUp) {
        throw new Error(`Failed to start ${service.name} within timeout`);
      }
      console.log(`${service.name} is listening.`);
    }

    console.log('\n--- ALL MICROSERVICES LOADED. EXECUTING SCENARIO FLOOPS ---');
    const gatewayUrl = 'http://localhost:3000';

    // 3. User Signups
    console.log('\n1. User Authentication signup...');
    const buyerEmail = `buyer_${Date.now()}@example.com`;
    const sellerEmail = `seller_${Date.now()}@example.com`;

    await axios.post(`${gatewayUrl}/auth/register`, { email: buyerEmail, password: 'SecurePassword123!', country: 'US' });
    await axios.post(`${gatewayUrl}/auth/register`, { email: sellerEmail, password: 'SecurePassword123!', country: 'US' });
    console.log('Signup completed.');

    // Logins
    console.log('Logging in user sessions...');
    const buyerLoginRes = await axios.post(`${gatewayUrl}/auth/login`, { email: buyerEmail, password: 'SecurePassword123!' });
    const sellerLoginRes = await axios.post(`${gatewayUrl}/auth/login`, { email: sellerEmail, password: 'SecurePassword123!' });
    
    const buyerToken = buyerLoginRes.data.accessToken;
    const buyerDecoded = jwt.decode(buyerToken) as any;
    const buyerId = buyerDecoded.sub;

    const sellerToken = sellerLoginRes.data.accessToken;
    const sellerDecoded = jwt.decode(sellerToken) as any;
    const sellerId = sellerDecoded.sub;
    console.log(`Buyer Logged In: ID=${buyerId}, Seller Logged In: ID=${sellerId}`);

    // Approve KYC for both to enable withdrawal requests later
    await prisma.kycApplication.createMany({
      data: [
        { userId: buyerId, level: 'STANDARD', status: 'APPROVED' },
        { userId: sellerId, level: 'STANDARD', status: 'APPROVED' },
      ],
    });

    // 4. Deposits Credit Simulation
    console.log('\n2. Simulating blockchain deposits...');
    const buyerTx = `0x_deposit_buyer_${Date.now()}`;
    const sellerTx = `0x_deposit_seller_${Date.now()}`;

    // Buyer deposits 10,000 USDT
    console.log('Simulating Buyer deposit: 10,000 USDT...');
    const buyerDepRes = await axios.post(`${gatewayUrl}/wallet/deposit/simulate`, {
      userId: buyerId,
      asset: 'USDT',
      amount: '10000.00',
      txHash: buyerTx,
    });
    console.log(`Buyer deposit status: ${buyerDepRes.data.status}`);

    // Seller deposits 1 BTC
    console.log('Simulating Seller deposit: 1.0 BTC...');
    const sellerDepRes = await axios.post(`${gatewayUrl}/wallet/deposit/simulate`, {
      userId: sellerId,
      asset: 'BTC',
      amount: '1.0',
      txHash: sellerTx,
    });
    console.log(`Seller deposit status: ${sellerDepRes.data.status}`);

    // Check account balances
    const buyerAcc = await prisma.account.findUnique({ where: { userId_asset: { userId: buyerId, asset: 'USDT' } } });
    const sellerAcc = await prisma.account.findUnique({ where: { userId_asset: { userId: sellerId, asset: 'BTC' } } });
    console.log(`Buyer USDT balance: ${buyerAcc?.balance.toString()}`);
    console.log(`Seller BTC balance: ${sellerAcc?.balance.toString()}`);

    if (!buyerAcc?.balance.equals(new Decimal('10000.00')) || !sellerAcc?.balance.equals(new Decimal('1.0'))) {
      throw new Error('E2E_DEPOSIT_FAIL: Deposit balances not credited properly');
    }
    console.log('Deposits successfully verified.');

    // 5. Connect WebSockets streams
    console.log('\n3. Connecting WebSocket client listeners on port 3004...');
    const buyerSocket = io('http://localhost:3004', { query: { token: buyerToken } });
    const sellerSocket = io('http://localhost:3004', { query: { token: sellerToken } });

    let orderbookUpdateReceived = false;
    let buyerTradeReceived = false;
    let sellerTradeReceived = false;

    buyerSocket.on('message', (payload) => {
      if (payload.channel === 'orderbook:BTC_USDT') {
        orderbookUpdateReceived = true;
      }
      if (payload.channel === `user:${buyerId}` && payload.data.type === 'TRADE_EXECUTION') {
        buyerTradeReceived = true;
      }
    });

    sellerSocket.on('message', (payload) => {
      if (payload.channel === `user:${sellerId}` && payload.data.type === 'TRADE_EXECUTION') {
        sellerTradeReceived = true;
      }
    });

    // Subscribe to BTC_USDT orderbook
    buyerSocket.emit('subscribe_orderbook', { symbol: 'BTC_USDT' });
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Placement Order & Matching
    console.log('\n4. Placing matching limit orders...');
    // Buyer places limit Buy order: 0.5 BTC @ 18,000.00 USDT (Total = 9,000 USDT cost)
    console.log('Buyer placing Limit BUY order: 0.5 BTC @ 18,000.00 USDT...');
    const buyOrderRes = await axios.post(`${gatewayUrl}/orders`, {
      userId: buyerId,
      symbol: 'BTC_USDT',
      side: 'BUY',
      type: 'LIMIT',
      price: '18000.00',
      quantity: '0.5',
    });
    console.log(`Buyer order placed. Status: ${buyOrderRes.data.order.status}`);

    // Seller places limit Sell order: 0.5 BTC @ 18,000.00 USDT
    console.log('Seller placing Limit SELL order: 0.5 BTC @ 18,000.00 USDT...');
    const sellOrderRes = await axios.post(`${gatewayUrl}/orders`, {
      userId: sellerId,
      symbol: 'BTC_USDT',
      side: 'SELL',
      type: 'LIMIT',
      price: '18000.00',
      quantity: '0.5',
    });
    console.log(`Seller order placed. Status: ${sellOrderRes.data.order.status}`);

    // Wait for match cycle & socket pushes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Assert WebSockets received the broadcasts
    console.log('\nWebSocket checks...');
    console.log('Orderbook L2 depth broadcast received:', orderbookUpdateReceived);
    console.log('Buyer private trade execution notification received:', buyerTradeReceived);
    console.log('Seller private trade execution notification received:', sellerTradeReceived);

    if (!orderbookUpdateReceived || !buyerTradeReceived || !sellerTradeReceived) {
      throw new Error('E2E_WEBSOCKET_FAIL: WebSocket pushes not received');
    }
    console.log('Real-time broadcasts verified.');

    // Assert balance updates
    const finalBuyerUsdt = await prisma.account.findUnique({ where: { userId_asset: { userId: buyerId, asset: 'USDT' } } });
    const finalBuyerBtc = await prisma.account.findUnique({ where: { userId_asset: { userId: buyerId, asset: 'BTC' } } });
    const finalSellerUsdt = await prisma.account.findUnique({ where: { userId_asset: { userId: sellerId, asset: 'USDT' } } });
    const finalSellerBtc = await prisma.account.findUnique({ where: { userId_asset: { userId: sellerId, asset: 'BTC' } } });

    // Buyer: started with 10,000 USDT. Cost = 9,000 USDT. Available = 1,000 USDT.
    // Buyer BTC: received 0.5 BTC. Taker fee = 0.2% on 0.5 BTC = 0.001 BTC. Credit balance = 0.499 BTC.
    console.log(`Buyer final USDT Available: ${finalBuyerUsdt?.balance.toString()}`);
    console.log(`Buyer final BTC Available: ${finalBuyerBtc?.balance.toString()}`);

    // Seller: started with 1.0 BTC. Cost = 0.5 BTC. Available = 0.5 BTC.
    // Seller USDT: received 9,000 USDT. Maker fee = 0.1% on 9,000 USDT = 9 USDT. Credit balance = 8,991 USDT.
    console.log(`Seller final USDT Available: ${finalSellerUsdt?.balance.toString()}`);
    console.log(`Seller final BTC Available: ${finalSellerBtc?.balance.toString()}`);

    if (!finalBuyerUsdt?.balance.equals(new Decimal('1000.00')) || !finalBuyerBtc?.balance.equals(new Decimal('0.499'))) {
      throw new Error('E2E_MATCH_FAIL: Buyer ledger balances incorrect');
    }
    if (!finalSellerUsdt?.balance.equals(new Decimal('8991.00')) || !finalSellerBtc?.balance.equals(new Decimal('0.5'))) {
      throw new Error('E2E_MATCH_FAIL: Seller ledger balances incorrect');
    }
    console.log('Ledger matching trade mutations verified.');

    // 7. Withdrawals Compliance and Settle
    console.log('\n5. Requesting withdrawal...');
    // Seller requests withdrawal of 5,000 USDT to external address
    const withdrawRes = await axios.post(`${gatewayUrl}/wallet/withdraw`, {
      userId: sellerId,
      asset: 'USDT',
      address: '0x_external_destination_address_here',
      amount: '5000.00',
    });
    console.log(`Withdrawal requested. Status: ${withdrawRes.data.status}, ID: ${withdrawRes.data.id}`);

    // Settle Admin Approval
    console.log('Settle admin approval for the withdrawal...');
    const approveRes = await axios.post(`${gatewayUrl}/wallet/withdraw/${withdrawRes.data.id}/approve`, {
      status: 'APPROVED',
      reviewerId: '00000000-0000-0000-0000-000000000001',
    });
    console.log(`Withdrawal settlement status: ${approveRes.data.status}, Tx: ${approveRes.data.txHash}`);

    // Check Seller USDT available: should be 8991.00 - (5000.00 + 10.00 fee) = 3981.00 USDT
    const postWithdrawSellerAcc = await prisma.account.findUnique({ where: { userId_asset: { userId: sellerId, asset: 'USDT' } } });
    console.log(`Seller final Available USDT: ${postWithdrawSellerAcc?.balance.toString()}`);
    if (!postWithdrawSellerAcc?.balance.equals(new Decimal('3981.00'))) {
      throw new Error('E2E_WITHDRAWAL_FAIL: Seller balance post-withdrawal incorrect');
    }

    // 8. Double-Entry ledger audits
    console.log('\n6. Checking double-entry ledger audits...');
    const auditRes = await axios.get(`${gatewayUrl}/ledger/audit`);
    console.log('Ledger audit result:', auditRes.data);
    if (auditRes.data.variance !== '0') {
      throw new Error(`E2E_AUDIT_FAIL: Ledger debit/credit variance is ${auditRes.data.variance}`);
    }
    console.log('Double-entry ledger math holds.');

    // Clean sockets
    buyerSocket.disconnect();
    sellerSocket.disconnect();

    console.log('\n============================================================');
    console.log('--- E2E QA INTEGRATION CHECKS COMPLETED SUCCESSFULLY ---');
    console.log('============================================================');
    cleanup(children, 0);

  } catch (err: any) {
    console.error('\n!!! E2E QA INTEGRATION CHECKS ENCOUNTERED ERROR !!!');
    if (err.response) {
      console.error('API Error Response:', err.response.status, err.response.data);
    } else {
      console.error(err);
    }
    cleanup(children, 1);
  }
}

function cleanup(children: ChildProcess[], code: number) {
  console.log('\nTerminating all spawned microservices...');
  for (const child of children) {
    child.kill('SIGTERM');
  }
  process.exit(code);
}

runE2E();
