import { WalletService } from './wallet/wallet.service';
import { prisma } from '@kryndex/database';
import { Decimal } from '@prisma/client/runtime/library';

async function verifyWalletInfrastructure() {
  console.log('--- STARTING WALLET & TRANSFER INFRASTRUCTURE VERIFICATION ---');

  // Clean up database tables for test isolation
  console.log('Cleaning up database tables...');
  await prisma.ledgerEntry.deleteMany({});
  await prisma.ledgerTransaction.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.withdrawal.deleteMany({});

  // 0. Ensure system users exist
  const reserveId = '00000000-0000-0000-0000-000000000000';
  const feeId = '00000000-0000-0000-0000-000000000002';

  const systemUser = await prisma.user.findUnique({ where: { id: reserveId } });
  if (!systemUser) {
    console.log('Seeding default system user for exchange reserves...');
    await prisma.user.create({
      data: {
        id: reserveId,
        email: 'system@kryndex.internal',
        passwordHash: '$argon2id$v=19$m=16384,t=3,p=4$SystemPasswordHashString',
      },
    });
  }

  const feeUser = await prisma.user.findUnique({ where: { id: feeId } });
  if (!feeUser) {
    console.log('Seeding default fee user for fee collection...');
    await prisma.user.create({
      data: {
        id: feeId,
        email: 'fees@kryndex.internal',
        passwordHash: '$argon2id$v=19$m=16384,t=3,p=4$FeePasswordHashString',
      },
    });
  }

  const walletService = new WalletService();

  // 1. Seed Mock User and KYC Application
  const testEmail = `user_${Date.now()}@example.com`;
  console.log(`Seeding mock user: ${testEmail}...`);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      passwordHash: '$argon2id$v=19$m=16384,t=3,p=4$MockPasswordHashString',
    },
  });

  console.log('Creating APPROVED KYC Application compliance record...');
  await prisma.kycApplication.create({
    data: {
      userId: user.id,
      level: 'STANDARD',
      status: 'APPROVED',
    },
  });

  // 2. Test deposit address generation
  console.log('\nTesting deposit address generation...');
  const wallet = await walletService.getOrCreateAddress(user.id, 'BTC');
  console.log(`Generated address: ${wallet.address} for asset ${wallet.asset}`);
  if (!wallet.address.startsWith('tb1q')) {
    console.error('FAIL: Deposit address does not match asset prefixtb1q');
    process.exit(1);
  }
  console.log('PASS: Wallet address generation verified.');

  // 3. Test simulated block scan deposit credit (confirmations 0 -> 6)
  console.log('\nTesting simulated block scanner deposit (amount = 2.5 BTC)...');
  const txHash = `0x_deposit_${Date.now()}`;
  const deposit = await walletService.simulateDeposit(user.id, 'BTC', '2.5', txHash);
  console.log(`Deposit status: ${deposit.status}, confirmations: ${deposit.confirmations}`);
  if (deposit.status !== 'CONFIRMED' || deposit.confirmations !== 6) {
    console.error('FAIL: Deposit was not processed with 6 confirmations');
    process.exit(1);
  }

  // Verify account balance credited
  const account = await prisma.account.findUnique({
    where: { userId_asset: { userId: user.id, asset: 'BTC' } },
  });
  console.log(`User BTC Account Balance: Available=${account?.balance.toString()}, Locked=${account?.lockedBalance.toString()}`);
  if (!account?.balance.equals(new Decimal('2.5'))) {
    console.error('FAIL: Deposit credit was not added to user balance');
    process.exit(1);
  }
  console.log('PASS: Deposit block scan and ledger credit verified.');

  // 4. Test withdrawal request and available/locked fund balances
  console.log('\nTesting withdrawal request: 1.0 BTC...');
  const withdrawAddress = `tb1q_withdraw_${Date.now()}`;
  const withdrawal = await walletService.requestWithdrawal(user.id, 'BTC', withdrawAddress, '1.0');
  console.log(`Withdrawal created. Status: ${withdrawal.status}, Fee: ${withdrawal.fee.toString()}`);

  const postRequestAccount = await prisma.account.findUnique({
    where: { userId_asset: { userId: user.id, asset: 'BTC' } },
  });
  console.log(`Balances post-request: Available=${postRequestAccount?.balance.toString()}, Locked=${postRequestAccount?.lockedBalance.toString()}`);
  
  // Total cost = 1.0 + 0.0005 fee = 1.0005 BTC
  const expectedAvailable = new Decimal('2.5').minus(new Decimal('1.0005'));
  const expectedLocked = new Decimal('1.0005');
  if (!postRequestAccount?.balance.equals(expectedAvailable) || !postRequestAccount.lockedBalance.equals(expectedLocked)) {
    console.error('FAIL: Balances not locked properly post-withdrawal request');
    process.exit(1);
  }
  console.log('PASS: Withdrawal balance locking checks passed.');

  // 5. Test Admin Withdrawal Approval Settle transfers
  console.log(`\nTesting admin approval for withdrawal ID: ${withdrawal.id}...`);
  const adminId = '00000000-0000-0000-0000-000000000001';
  const completedWithdrawal = await walletService.handleWithdrawalApproval(withdrawal.id, 'APPROVED', adminId);
  console.log(`Withdrawal state: ${completedWithdrawal.status}, Hash: ${completedWithdrawal.txHash}`);
  if (completedWithdrawal.status !== 'COMPLETED' || !completedWithdrawal.txHash) {
    console.error('FAIL: Admin withdrawal approval processing failed');
    process.exit(1);
  }

  // Check user locked balance releases
  const finalAccount = await prisma.account.findUnique({
    where: { userId_asset: { userId: user.id, asset: 'BTC' } },
  });
  console.log(`Balances post-approval: Available=${finalAccount?.balance.toString()}, Locked=${finalAccount?.lockedBalance.toString()}`);
  if (!finalAccount?.lockedBalance.isZero()) {
    console.error('FAIL: User locked balance was not released');
    process.exit(1);
  }

  // Check system fee collection balance
  const systemFeeAcc = await prisma.account.findUnique({
    where: { userId_asset: { userId: '00000000-0000-0000-0000-000000000002', asset: 'BTC' } },
  });
  console.log(`System reserve fee collection account balance: ${systemFeeAcc?.balance.toString()} BTC`);
  if (!systemFeeAcc?.balance.equals(new Decimal('0.0005'))) {
    console.error('FAIL: Fee collection account was not credited');
    process.exit(1);
  }
  console.log('PASS: Admin withdrawal approval settlement verified.');

  // 6. Test Double-Entry balancing Equations (Ledger entries match)
  console.log('\nAudit verification checks of double-entry ledger entries totals...');
  const sums = await prisma.ledgerEntry.groupBy({
    by: ['type'],
    _sum: { amount: true },
  });
  
  let debitsSum = new Decimal(0);
  let creditsSum = new Decimal(0);
  for (const sum of sums) {
    if (sum.type === 'DEBIT' && sum._sum.amount) debitsSum = new Decimal(sum._sum.amount);
    if (sum.type === 'CREDIT' && sum._sum.amount) creditsSum = new Decimal(sum._sum.amount);
  }
  
  const variance = debitsSum.minus(creditsSum);
  console.log(`Ledger Total Debits: ${debitsSum.toString()}`);
  console.log(`Ledger Total Credits: ${creditsSum.toString()}`);
  console.log(`Ledger Variance (Debits - Credits): ${variance.toString()}`);
  if (!variance.isZero()) {
    console.error('FAIL: Ledger double-entry math violated! Credits must balance Debits');
    process.exit(1);
  }
  console.log('PASS: Double-entry ledger audit verification passed.');

  console.log('\n--- ALL WALLET & TRANSFER INFRASTRUCTURE CHECKS PASSED ---');
}

verifyWalletInfrastructure()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test script exception:', err);
    process.exit(1);
  });
