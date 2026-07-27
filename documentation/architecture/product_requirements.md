# Product Requirements Document (PRD) - Kryndex Exchange

## 1. Brand Definition & Aesthetics

Kryndex is a premium, secure, and high-performance centralized cryptocurrency exchange (CEX) designed for retail, professional, and institutional traders. The brand slogan is **"Trade Beyond Limits"**.

### Visual Direction
- **Theme**: Dark-first professional trading environment.
- **Colors**:
  - Primary Background: `#0B0E11` (Deep Charcoal)
  - Secondary Background: `#151A21` (Slate Charcoal)
  - Elevated Surface: `#1E2329` (Lighter Slate)
  - Primary Accent: `#F5B731` (Kryndex Premium Gold)
  - Primary Text: `#F4F4F5` (High-contrast Off-White)
  - Secondary Text: `#A1A1AA` (Muted Grey)
  - Success/Positive Movement: `#16C784` (Emerald Green)
  - Danger/Negative Movement: `#EA3943` (Crimson Red)
  - Border: `#2B3139` (Slate Border)
- **Typography**: Modern geometric sans-serif (e.g., Inter or Outfit), optimized for tabular financial figures.
- **Branding Architecture**: Configuration settings must support administrative branding changes (logos, slogans, colors) via the admin panel.

---

## 2. User Roles & Permissions Matrix

Kryndex uses Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) to enforce strict separation of duties.

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **CUSTOMER** | End-user who trades, deposits, and withdraws assets. | `orders.create`, `orders.cancel`, `wallets.read`, `deposits.create`, `withdrawals.create`, `kyc.submit` |
| **SUPPORT_AGENT** | Handles customer inquiries and ticket resolution. | `tickets.read`, `tickets.reply`, `users.read` |
| **KYC_ANALYST** | Reviews verification applications and files. | `kyc.read`, `kyc.review`, `kyc.approve`, `kyc.reject` |
| **COMPLIANCE_OFFICER** | Manages regulatory checks, freezes accounts, reviews alerts. | `compliance.read`, `users.restrict`, `users.freeze`, `alerts.manage` |
| **FINANCE_OFFICER** | Monitors financials, reconciles ledger, checks reserves. | `ledger.read`, `reports.generate`, `reconciliation.run` |
| **WALLET_OPERATOR** | Manages hot/cold wallet keys, monitors gas fees, configures nets. | `wallets.manage`, `networks.manage`, `withdrawals.sign` |
| **TRADING_OPERATOR** | Configures symbols, fees, limits, and matching engine status. | `pairs.manage`, `fees.manage`, `engine.control` |
| **SECURITY_ADMIN** | Manages audit logs, staff provisioning, credentials. | `staff.manage`, `audit.read`, `security.configure` |
| **SUPER_ADMIN** | Full administrative rights, system settings. | `*` (All permissions, including four-eye setup modifications) |
| **AUDITOR** | Read-only view of transaction ledgers, audit logs, compliance. | `ledger.read`, `audit.read`, `compliance.read`, `reports.read` |

---

## 3. Functional Requirements

### 3.1 Account & Identity Management
- **Registration & Verification**: Users register via email. Email verification is mandatory via short-lived OTP/tokens.
- **Security & MFA**: Enforce strong passwords, time-based one-time passwords (TOTP - Google Authenticator), security notifications for new logins/devices, and anti-phishing codes.
- **KYC Tiers**:
  1. *Unverified*: Restrict withdrawals and trading.
  2. *Basic*: Simple profile entry. Low trading and withdrawal limits ($1,000 daily limit).
  3. *Standard*: ID document + Selfie verification. Medium limits ($50,000 daily limit).
  4. *Enhanced*: Proof of address + Source of funds. High limits ($500,000 daily limit).
  5. *Institutional*: Corporate entity verification. Customized limits.

### 3.2 Wallet & Blockchain Operations
- **Deposits**: Dynamic generation of deposit addresses for supported assets (BTC, ETH, USDT, USDC). Process transactions after configurable confirmation thresholds.
- **Withdrawals**: Multi-factor authentication required. Limit checks, destination address validation, and blocklist screening. High-value withdrawals require manual compliance approval and admin "four-eye" verification.
- **Double-Entry Ledger**: Every movement of funds (deposits, trading locks, trade settlements, withdrawals, fees) must be logged as a double-entry ledger entry matching the invariant: `Total Debits = Total Credits`.

### 3.3 Spot Trading & Order Management
- **Order Types**: Support Limit and Market orders.
- **Execution Rules**: Price-time priority. Self-trade prevention (cancel oldest/newest). Minimum order sizes based on minimum notional configuration.
- **Asset Precision**: All balances and order quantities must use integer representations of the smallest units (e.g., satoshis, wei) to prevent floating-point calculation errors.

### 3.4 Market Data & Interface
- **Tickers & Candles**: Real-time market state broadcast via WebSockets. historical charts via ClickHouse aggregated candles.
- **Order Book**: Real-time Level 2 (L2) order book depth.

### 3.5 Administration Dashboard
- **Staff Control**: Security admins manage staff roles.
- **Reconciliation & Auditing**: Automatic nightly financial reconciliation reports comparing total database ledger balances against actual hot/cold wallet balances.
- **System Emergency Controls**: Ability to suspend trading pairs or freeze deposits/withdrawals globally or per account.

---

## 4. MVP Scope & Constraints

To ensure safety and reliability, the initial release (MVP) is limited strictly to spot trading of selected assets.

### Supported MVP Features
- Spot order book trading.
- Limit and Market orders.
- GTC (Good-Till-Cancelled), IOC (Immediate-Or-Cancel), FOK (Fill-Or-Kill) time-in-force.
- BTC, ETH, USDT, USDC on Bitcoin/Ethereum testnets.
- Identity verification (Basic, Standard, Enhanced).
- Dual-signature/Four-eye review for admin functions.

### Explicitly Unsupported Features (Excluded from MVP)
- **Margin & Leverage Trading** (No borrowed funds, no liquidations).
- **Futures & Options** (No derivatives, perpetuals, or expiry contracts).
- **Lending & Borrowing** (No yield generation or interest products).
- **Copy Trading** (No automated trade copying).
- **Token Launchpads** (No initial exchange offerings).
- **Earn / Staking / Yield Farming** (No complex financial yield products).

---

## 5. Non-Functional Requirements (NFRs)

- **Consistency**: In-memory double-entry balance verification before order matching. Zero-float arithmetic.
- **Latency**: Matching engine execution latency below 1 millisecond. API endpoint roundtrip (p95) below 250 milliseconds.
- **Availability**: High availability with sub-second failover. Replay-able matching engine log journals.
- **Compliance & Privacy**: Encryption of personally identifiable information (PII) at rest using AES-256-GCM. Object storage for KYC files protected by single-use presigned URLs.
