# System Flows and Mermaid Diagrams - Kryndex Exchange

This document maps out the core data and control flows of the Kryndex cryptocurrency exchange platform using Mermaid diagrams.

---

## 1. Authentication & Session Management Flow

This diagram demonstrates user login, token issuance, multi-factor authentication (MFA) validation, and session registration.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant Web as Web/Mobile App
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Cache as Redis Cache
    participant DB as Postgres DB

    User->>Web: Input Credentials (Email, Password)
    Web->>GW: POST /auth/login
    GW->>Auth: Authenticate(email, password)
    Auth->>DB: Query User by Email
    DB-->>Auth: Password Hash, Salt, Security Status
    Auth->>Auth: Verify Argon2id Hash

    alt Hash Verification Failed
        Auth-->>User: Return 401 Unauthorized (Track Failed Attempt)
    else Hash Verification Succeeded
        Auth->>DB: Check if MFA (TOTP) is active
        DB-->>Auth: MFA Active status
        alt MFA Active
            Auth->>Cache: Create Temporary Session (Token, expires 5m)
            Auth-->>Web: Return 200 (MFA Challenge Required + Temp Token)
            User->>Web: Provide 6-Digit TOTP Code
            Web->>GW: POST /auth/2fa/verify (with Temp Token + Code)
            GW->>Auth: VerifyMfa(Temp Token, Code)
            Auth->>Auth: Validate Code using TOTP Secret
        end
        Auth->>DB: Log Successful Attempt & Device Fingerprint
        Auth->>Cache: Store Active Session (Refresh Token JWT)
        Auth-->>Web: Return short-lived Access Token & HTTP-only Refresh Token
    end
```

---

## 2. Deposit & Confirmation Scan Flow

This diagram shows how the Blockchain Indexer detects deposits, records pending balances, and updates the double-entry ledger upon confirmation.

```mermaid
sequenceDiagram
    autonumber
    participant Chain as Blockchain Network
    participant Indexer as Blockchain Indexer
    participant Wallet as Wallet Service
    participant Ledger as Ledger Service
    participant DB as Postgres DB
    participant MQ as Kafka Event Stream

    Chain->>Indexer: New Block Discovered
    Indexer->>Indexer: Parse Block Transactions
    loop For Each Transaction
        Indexer->>DB: Check if ToAddress matches DepositAddress table
        alt Address Match Found
            Indexer->>Wallet: Emit DepositDetected(TxHash, ToAddress, Amount, BlockNum)
            Wallet->>Ledger: POST /ledger/transactions (Type: DEPOSIT_PENDING)
            Note over Ledger: Create LedgerTransaction<br/>Credit PENDING_DEPOSIT<br/>Debit SUSPENSE
            Wallet->>MQ: Publish "deposit.pending" Event
            loop Block Confirmations
                Chain->>Indexer: Confirmation Incremented
                alt Confirmations >= Network Threshold
                    Indexer->>Wallet: DepositConfirmed(TxHash)
                    Wallet->>Ledger: POST /ledger/transactions/complete (TxHash)
                    Note over Ledger: Debit PENDING_DEPOSIT<br/>Credit USER_AVAILABLE<br/>Verify Debits = Credits
                    Ledger->>DB: Save LedgerEntries & Update Balance in DB
                    Wallet->>MQ: Publish "deposit.credited" Event
                end
            end
        end
    end
```

---

## 3. Withdrawal Request & Approval Flow

This diagram maps out the user withdrawal process, compliance risk screening, admin multi-signature/four-eye approval, and network broadcast.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant Web as Web/Mobile App
    participant GW as API Gateway
    participant Wallet as Wallet Service
    participant Compliance as Compliance Service
    participant Ledger as Ledger Service
    actor Admin1 as Finance/Compliance Admin
    actor Admin2 as Super-Admin (4-Eye)

    User->>Web: Request Withdrawal (Asset, Address, Amount, TOTP)
    Web->>GW: POST /wallet/withdraw
    GW->>Ledger: Check Available Balances & Rate Limits
    alt Insufficient Balance
        Ledger-->>User: Error: Insufficient Balance
    else Sufficient Balance
        Ledger->>Ledger: Lock Balance (Debit USER_AVAILABLE, Credit USER_LOCKED)
        GW->>Compliance: Check Risk Profile & Address Allowlist
        Compliance-->>GW: Risk Score (Low/Medium/High)
        alt High Risk OR Large Amount
            GW->>Wallet: Create Withdrawal Queue Entry (Status: PENDING_APPROVAL)
            Admin1->>Wallet: Approve Withdrawal (Review Signature 1)
            Admin2->>Wallet: Co-Approve Withdrawal (Review Signature 2 - Four-Eye)
        end
        Wallet->>Wallet: Prepare & Sign Blockchain Transaction (HSM Mock Signature)
        Wallet->>Ledger: Complete Withdrawal Ledger Transaction (Debit USER_LOCKED, Credit BLOCKCHAIN_HOT)
        Wallet->>Wallet: Broadcast signed transaction to network
        Wallet-->>User: Notify: Withdrawal Broadcasted
    end
```

---

## 4. Order Lifecycle Flow

This diagram traces an order from user submission, balance locking in the ledger, execution in the matching engine, and settlement database recording.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant Web as Web/Mobile App
    participant Trading as Trading Service
    participant Ledger as Ledger Service
    participant Engine as Matching Engine (Rust)
    participant MQ as Kafka Event Stream

    User->>Web: Submit Limit Buy Order (Price, Qty, Pair: BTC_USDT)
    Web->>Trading: POST /orders
    Trading->>Trading: Validate Price & Qty against limits
    Trading->>Ledger: Lock funds (Debit USDT_AVAILABLE, Credit USDT_LOCKED)
    alt Balance Lock Fails (Insufficient funds)
        Ledger-->>Trading: Insufficient balance
        Trading-->>User: Return Error Response
    else Balance Lock Success
        Trading->>MQ: Publish command: CreateOrder(OrderParams)
        MQ->>Engine: Ingest Order Command
        Engine->>Engine: Process Match in Memory
        alt Order Matched (Fill/Partial Fill)
            Engine->>MQ: Publish TradeEvent(MakerOrderId, TakerOrderId, Price, Qty)
            MQ->>Trading: Ingest Trade Event
            Trading->>Ledger: Settle Trade (Transfer BTC & USDT, deduct fees)
            Trading->>MQ: Publish "user.orders.filled" / "user.balances.updated"
        else No Match (Order Resting)
            Engine->>MQ: Publish OrderOpenedEvent(OrderId)
            MQ->>Trading: Update DB Order status to OPEN
        end
        Trading-->>User: Return Order Accepted Receipt
    end
```

---

## 5. Double-Entry Ledger Transaction & Settlement Flow

This diagram illustrates how transaction settlement operates on the immutable ledger. Inter-asset trades require balanced matching entries to maintain system invariants.

```mermaid
sequenceDiagram
    autonumber
    participant Settle as Settlement Worker
    participant DB as Postgres DB

    Note over Settle: A Trade occurs:<br/>Buyer buys 1 BTC for 50,000 USDT.<br/>Fees: Taker (Buyer) pays 50 USDT, Maker (Seller) pays 50 USDT.
    
    Settle->>DB: BEGIN TRANSACTION
    
    Note over Settle: 1. Move Quote Asset (USDT) from Buyer to Seller
    Settle->>DB: Debit Buyer USDT Locked Account: -50,000 USDT
    Settle->>DB: Credit Seller USDT Available Account: +50,000 USDT
    
    Note over Settle: 2. Move Base Asset (BTC) from Seller to Buyer
    Settle->>DB: Debit Seller BTC Locked Account: -1.00000000 BTC
    Settle->>DB: Credit Buyer BTC Available Account: +1.00000000 BTC
    
    Note over Settle: 3. Deduct Fees and Credit Exchange Revenue
    Settle->>DB: Debit Buyer USDT Available (Taker Fee): -50 USDT
    Settle->>DB: Credit Exchange Fee Revenue USDT Account: +50 USDT
    Settle->>DB: Debit Seller USDT Available (Maker Fee): -50 USDT
    Settle->>DB: Credit Exchange Fee Revenue USDT Account: +50 USDT
    
    Note over Settle: Invariant Check: Sum of all USDT changes = 0<br/>Sum of all BTC changes = 0
    Settle->>DB: Verify Group Balance == 0
    
    alt Invariant Fails
        Settle->>DB: ROLLBACK
        Note over Settle: Halt processing and raise critical alert
    else Invariant Passes
        Settle->>DB: COMMIT
        Note over Settle: Update User Balance Cache in Redis
    end
```

---

## 6. Service-Boundary & Message-Routing Architecture

This diagram shows the system boundaries and interaction patterns of Kryndex.

```mermaid
graph TB
    subgraph Client Tier
        Web["Next.js Customer App"]
        Admin["Next.js Admin Dashboard"]
        Mobile["Flutter Mobile App"]
    end

    subgraph Edge Gateway
        AGW["API Gateway (Rate Limiter, CORS, WAF)"]
    end

    subgraph Core Services
        AuthService["Auth Service (Argon2id, JWT, MFA)"]
        UserService["User Service (KYC, Compliance, Profiles)"]
        TradingService["Trading Service (Order Validation, State)"]
        LedgerService["Ledger Service (Double-Entry Ledger, Balances)"]
        WalletService["Wallet Service (Indexers, Signing API)"]
        MarketService["Market Data Service (WS Gateway, ClickHouse ingestion)"]
    end

    subgraph High-Performance Matcher
        ME["Matching Engine (Rust)"]
    end

    subgraph Persistence / Queueing
        Kafka["Apache Kafka Event Bus"]
        Postgres["PostgreSQL Transactional DB"]
        Redis["Redis Cache & Lock"]
        ClickHouse["ClickHouse OLAP Engine"]
        S3["KYC S3 Object Storage"]
    end

    Client-Tier -->|HTTP / WS| Edge-Gateway
    AGW -->|gRPC| AuthService
    AGW -->|gRPC| UserService
    AGW -->|gRPC| TradingService
    AGW -->|gRPC| WalletService
    AGW -->|WebSocket| MarketService

    TradingService -->|gRPC| LedgerService
    TradingService -->|Kafka| ME
    ME -->|Kafka| MarketService
    ME -->|Kafka| TradingService
    WalletService -->|gRPC| LedgerService

    Postgres -.->|Read/Write| CoreServices
    Redis -.->|Lock / Session| CoreServices
    ClickHouse -.->|Historical Candles| MarketService
    S3 -.->|Encrypted Attachments| UserService
```
