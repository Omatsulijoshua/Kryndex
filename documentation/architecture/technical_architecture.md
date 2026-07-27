# Technical Architecture Document - Kryndex Exchange

## 1. System Overview & Architecture Diagram

Kryndex utilizes a distributed, event-driven microservices architecture optimized for low-latency trading, strict ledger consistency, and high availability. Services communicate via asynchronous message streams (Apache Kafka) for non-blocking processes and synchronous gRPC for transactional operations. Public entry points are routed via an API Gateway.

```
                  ┌──────────────────────┐
                  │  Cloudflare / WAF    │
                  └──────────┬───────────┘
                             │ (HTTPS / WSS)
                  ┌──────────▼───────────┐
                  │    API Gateway       │
                  └────┬───────────┬─────┘
                       │           │
          ┌────────────▼───┐   ┌───▼────────────────┐
          │  Auth Service  │   │  Trading Service   │
          └────────────────┘   └───┬────────────┬───┘
                                   │ (gRPC)     │ (Kafka)
                     ┌─────────────▼──┐   ┌─────▼──────────────┐
                     │ Ledger Service │   │  Matching Engine   │
                     │  (Database)    │   │  (In-Memory Rust)  │
                     └────────────────┘   └─────────────┬──────┘
                                                        │ (Kafka events)
                                           ┌────────────▼──────┐
                                           │ Market Data Serv. │
                                           └────────────┬──────┘
                                                        │
                                           ┌────────────▼──────┐
                                           │   ClickHouse DB   │
                                           └───────────────────┘
```

---

## 2. Monorepo Structure

The codebase is organized as a monorepo managed via `pnpm` workspaces and `Turborepo`:

- `/apps`
  - `/web`: Customer Next.js application (React, Tailwind CSS, Zustand, Shadcn UI).
  - `/admin`: Super-admin Next.js dashboard (React, Tailwind CSS, Recharts, TanStack Table).
  - `/mobile`: Customer Flutter mobile application (Riverpod, GoRouter, Dio).
- `/services`
  - `/api-gateway`: Route orchestration, rate limiting, and HTTP-to-gRPC transcoding.
  - `/auth-service`: Authentication, JWT issuance, MFA (TOTP), session tracking.
  - `/user-service`: User profiles, KYC applications, compliance checks.
  - `/ledger-service`: Double-entry transaction engine, balances, and reconciliation.
  - `/trading-service`: Order validation, balance locking/unlocking, state management.
  - `/matching-engine`: High-performance Rust engine managing order books in-memory.
  - `/market-data-service`: WebSocket streaming, historical chart calculation.
  - `/wallet-service`: Deposit detection, block indexers, withdrawal signing logic.
  - `/notification-service`: Email, SMS, push notifications.
- `/packages`
  - `/database`: Prisma schema definitions, migrations, and shared database clients.
  - `/shared-types`: Common TypeScript definitions.
  - `/shared-validation`: Zod schemas for request validation.
  - `/shared-config`: Shared configurations (environment schema, CORS, compression).
  - `/shared-security`: Argon2id wrappers, JWT verification, decryption utils.
  - `/ui`: Shared design components based on the premium Kryndex design system.

---

## 3. Data Tier Strategy

| Storage System | Role | Justification |
| :--- | :--- | :--- |
| **PostgreSQL** | Primary transactional database. | Relational integrity, ACID compliance for User, KYC, Wallet, and Ledger entities. |
| **Redis** | High-speed cache, rate limiting, session storage, locks. | Key-value store for session validity, IP blocklists, and distributed locking. |
| **Apache Kafka** | Event broker & processing pipeline. | Decoupled event-driven flows (fills, ledger reconciliation, notifications). |
| **ClickHouse** | OLAP database for market history and analytical logs. | Extremely high throughput and efficiency for candles and order book updates. |
| **OpenSearch** | Log ingestion, audit trail, search indexing. | Centralized searching of server logs, user activities, and security events. |
| **MinIO / AWS S3** | Encrypted document repository. | Storage of sensitive user KYC files, proof of address, and export files. |

---

## 4. Database Schema Design (Prisma-aligned entities)

All primary database tables are defined using PostgreSQL. Publicly exposed keys are UUIDv4. Balances are represented as bigints representing the smallest division of the asset (e.g. Satoshi for BTC, Wei for ETH) to eliminate floating-point drift.

### 4.1 Account & Identity Management

- **User**: Primary login entry.
  - `id`: UUID (Primary Key)
  - `email`: VARCHAR (Unique)
  - `passwordHash`: VARCHAR (Argon2id)
  - `status`: ENUM (ACTIVE, SUSPENDED, FROZEN)
  - `createdAt`: TIMESTAMPTZ
  - `updatedAt`: TIMESTAMPTZ

- **UserProfile**: Personal information (encrypted at rest using AES-256-GCM).
  - `userId`: UUID (Foreign Key -> User.id)
  - `legalFirstName`: VARCHAR (Encrypted)
  - `legalLastName`: VARCHAR (Encrypted)
  - `dateOfBirth`: DATE (Encrypted)
  - `country`: VARCHAR
  - `nationality`: VARCHAR
  - `sourceOfFunds`: VARCHAR
  - `expectedVolume`: VARCHAR

- **UserSecurity**: Security settings.
  - `userId`: UUID (Foreign Key -> User.id)
  - `mfaSecret`: VARCHAR (TOTP secret, encrypted)
  - `mfaEnabled`: BOOLEAN
  - `antiPhishingCode`: VARCHAR (Muted display string)
  - `passwordUpdatedAt`: TIMESTAMPTZ
  - `lockoutUntil`: TIMESTAMPTZ
  - `failedLoginAttempts`: INT

- **UserDevice** & **UserSession**:
  - Track trusted devices, fingerprints, IPs, user agents, and active JWT refresh tokens.

- **Role** & **Permission** & **StaffRole**:
  - Permissions model mapping staff roles (e.g., `COMPLIANCE_OFFICER`, `KYC_ANALYST`) to permission tags (`kyc.review`, `users.freeze`).

### 4.2 Compliance & Verification

- **KycApplication**:
  - `id`: UUID
  - `userId`: UUID (Foreign Key -> User.id)
  - `level`: ENUM (UNVERIFIED, BASIC, STANDARD, ENHANCED, INSTITUTIONAL)
  - `status`: ENUM (NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED, EXPIRED)
  - `reviewerId`: UUID (Nullable, Foreign Key -> User.id)
  - `reviewComments`: TEXT
  - `createdAt`: TIMESTAMPTZ

- **KycDocument**:
  - `id`: UUID
  - `applicationId`: UUID (Foreign Key -> KycApplication.id)
  - `type`: ENUM (IDENTITY_CARD, PASSPORT, UTILITY_BILL, BANK_STATEMENT)
  - `s3Key`: VARCHAR (Encrypted S3 reference)
  - `expiryDate`: DATE

- **RiskProfile**:
  - `userId`: UUID (Foreign Key)
  - `score`: INT (0 - 100)
  - `classification`: ENUM (LOW, MEDIUM, HIGH)
  - `lastScreenedAt`: TIMESTAMPTZ

### 4.3 Wallets & Ledger

- **Asset**:
  - `symbol`: VARCHAR (Primary Key, e.g. "BTC")
  - `name`: VARCHAR
  - `decimals`: INT (e.g. 8 for BTC, 18 for ETH)
  - `depositEnabled`: BOOLEAN
  - `withdrawalEnabled`: BOOLEAN
  - `minDeposit`: BIGINT
  - `minWithdrawal`: BIGINT
  - `withdrawalFee`: BIGINT

- **BlockchainNetwork**:
  - `id`: VARCHAR (e.g. "ETHEREUM_TESTNET")
  - `name`: VARCHAR
  - `isActive`: BOOLEAN
  - `confirmationRequirement`: INT

- **AssetNetwork**:
  - Mapping between Assets and Networks containing network-specific attributes (contract addresses, fee tiers).

- **LedgerAccount**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Nullable for system accounts like `EXCHANGE_FEES`, `ADJUSTMENT`)
  - `type`: ENUM (AVAILABLE, LOCKED, PENDING_DEPOSIT, PENDING_WITHDRAWAL, REVENUE, BLOCKCHAIN_HOT)
  - `assetSymbol`: VARCHAR (Foreign Key -> Asset.symbol)
  - `balance`: BIGINT (Default 0)

- **LedgerTransaction**:
  - `id`: UUID (Primary Key)
  - `correlationId`: UUID
  - `type`: ENUM (DEPOSIT_CREDIT, WITHDRAWAL_RESERVE, TRADE_SETTLEMENT, FEE_COLLECTION, REVERSAL)
  - `description`: VARCHAR
  - `createdAt`: TIMESTAMPTZ

- **LedgerEntry**:
  - `id`: UUID (Primary Key)
  - `transactionId`: UUID (Foreign Key -> LedgerTransaction.id)
  - `accountId`: UUID (Foreign Key -> LedgerAccount.id)
  - `amount`: BIGINT (Negative for debit, positive for credit)

### 4.4 Orders & Trading

- **TradingPair**:
  - `symbol`: VARCHAR (Primary Key, e.g. "BTC_USDT")
  - `baseAsset`: VARCHAR (Foreign Key)
  - `quoteAsset`: VARCHAR (Foreign Key)
  - `minQty`: BIGINT
  - `maxQty`: BIGINT
  - `minNotional`: BIGINT
  - `priceTickSize`: BIGINT
  - `qtyStepSize`: BIGINT
  - `makerFeeBps`: INT
  - `takerFeeBps`: INT
  - `status`: ENUM (DRAFT, ACTIVE, SUSPENDED, CLOSE_ONLY, DELISTED)

- **Order**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Foreign Key)
  - `pairSymbol`: VARCHAR (Foreign Key)
  - `side`: ENUM (BUY, SELL)
  - `type`: ENUM (LIMIT, MARKET)
  - `timeInForce`: ENUM (GTC, IOC, FOK)
  - `price`: BIGINT (Smallest currency unit)
  - `quantity`: BIGINT
  - `filledQuantity`: BIGINT (Default 0)
  - `status`: ENUM (PENDING, OPEN, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED, EXPIRED)
  - `createdAt`: TIMESTAMPTZ

- **Trade**:
  - `id`: UUID (Primary Key)
  - `pairSymbol`: VARCHAR (Foreign Key)
  - `buyerOrderId`: UUID (Foreign Key)
  - `sellerOrderId`: UUID (Foreign Key)
  - `price`: BIGINT
  - `quantity`: BIGINT
  - `buyerFee`: BIGINT
  - `sellerFee`: BIGINT
  - `createdAt`: TIMESTAMPTZ

---

## 5. Ledger Financial Consistency Rules

The ledger is built on immutable append-only structures to prevent data falsification and database corruption.

1. **Balance Separation**: A user's total assets are segregated into distinct ledger accounts (`AVAILABLE` and `LOCKED`).
2. **Transaction Balance Invariant**: Every ledger transaction must comprise a balanced journal containing at least two ledger entries. The net value must sum to zero:
   $$\sum \text{LedgerEntry.amount} = 0$$
3. **Asset Consistency**: All entries within a single transaction group must share the same asset symbol. Inter-asset swaps are not permitted within a single group (swaps must be settled through corresponding debit/credit pairs using a trading intermediary account).
4. **No Update Overwrite**: Ledger balances are updated via triggers or service logic appending to the `LedgerEntry` table. Direct balance mutation in the `LedgerAccount` table is only allowed via aggregation of ledger entries.
5. **No Deletions**: Deletion or editing of transactions or entries is prevented by database role permissions. Erroneous postings must be corrected via balancing reversal transactions.
6. **Concurrent Updates**: Balance changes use Optimistic Concurrency Control (OCC) or strict sequence serialisation using PostgreSQL transactions to guarantee balance checks cannot be bypassed.

---

## 6. Rust Matching Engine Architecture

The matching engine is designed as an ultra-fast, single-threaded in-memory Rust state machine.

### Memory Layout
- **Order Books**: Contained in B-Trees or Binary Heaps. Orders are keyed by:
  - Bids: Price (Descending), Time (Ascending)
  - Asks: Price (Ascending), Time (Ascending)
- **Fast Lookup**: HashMaps linking `OrderId` to order memory references.

### Pipeline Flow
1. **Command Input**: Orders, cancellations, and modifications are ingested via TCP gRPC or Kafka.
2. **Event Sourcing / Journaling**: The matching engine writes incoming instructions to an append-only transaction journal on disk before processing.
3. **Execution**: The memory state machine matches the order against the book.
4. **Deterministic Events**: Trade, Partial Fill, and Order Open events are published to Kafka.
5. **State Snapshots**: Periodic memory dumps (snapshots) are taken to prune the transaction log journal and allow rapid recovery upon restarts.
