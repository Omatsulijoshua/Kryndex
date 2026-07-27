# Regulatory & Operational Readiness Document - Kryndex Exchange

This document details the compliance architecture, customer identification protocols, risk screening, geo-fencing mechanics, transaction monitoring, data privacy policies, and record retention guidelines.

---

## 1. Jurisdiction & Geo-Fencing Configuration

Kryndex does not operate globally. Configurable rules must restrict access from banned jurisdictions, enforce minimum age requirements, and check user eligibility.

### Geo-IP Restrictions
- **Service Integration**: The API Gateway integrates with a Geo-IP database (e.g. MaxMind GeoIP2) to resolve client IP addresses to countries and regions.
- **Blocklist Controls**: Administrative controls allow toggling restricted country codes (e.g., US, IR, KP, SY) globally.
- **Rule Actions**:
  - IP matches blocked country -> Return `403 Forbidden` response.
  - IP matches grey list -> Restrict trading functions (view only).

### Eligibility Rules
- **Age Restriction**: Enforced during onboarding. Date of Birth must resolve to $\ge 18$ years of age.
- **PEP Checks**: Politically Exposed Persons (PEPs) must be flagged and escalated to a compliance officer for Enhanced Due Diligence (EDD) prior to standard approval.

---

## 2. Customer Identification (KYC) Levels

| KYC Level | Verification Requirements | System Restrictions | Daily Limit |
| :--- | :--- | :--- | :--- |
| **UNVERIFIED** | Email verified only. | Trading and withdrawals disabled. | $0 |
| **BASIC** | Legal Name, DoB, Country, Telephone. | Spot trading enabled. Withdrawals locked. | $1,000 USD equivalent |
| **STANDARD** | Identity Document (Passport/ID Card) + Selfie photo. | Spot trading enabled. Crypto deposits & withdrawals enabled. | $50,000 USD equivalent |
| **ENHANCED** | Utility Bill or Bank Statement (Proof of Address) + Source of Funds declaration. | Custom high-volume trading enabled. | $500,000 USD equivalent |
| **INSTITUTIONAL** | Corporate registry doc, ultimate beneficial owner (UBO) verification, LEI. | High-throughput API access. | Custom |

---

## 3. Transaction Monitoring & Sanctions Screening

### Sanctions Screening
- **Timing**: Screen users at registration, before standard KYC approval, and daily against global sanctions lists (OFAC, EU, UN, HMT).
- **Triggers**: Name matches or wallet destination matches on-chain blocked addresses.
- **Action**: Immediately flag the account as `FROZEN`, halt order matching, suspend deposits/withdrawals, and log a `ComplianceAlert`.

### Transaction Monitoring (AML)
- **Velocity Check**: Detect multiple rapid withdrawals to the same or split addresses within a short timeframe.
- **Amount Thresholds**: Flag deposits or withdrawals exceeding $10,000 USD equivalent for compliance reporting (e.g. SAR filing).
- **Structure Detection**: Detect systematic sub-threshold transactions (e.g., consecutive deposits of $9,900) to prevent structuring.

---

## 4. Operational Case Management & Privacy (GDPR/CCPA)

### Compliance Case Management
- Compliance officers can create cases against flagged accounts.
- Staff can attach internal notes, evidence docs, and review findings.
- Audits must log when a compliance case is opened, assigned, or closed.

### Data Privacy & Records
- **Record Retention**: Retain all user registration, KYC documentation, ledger balances, and audit records for at least **5 years** after account closure (per global AML/FATF guidelines).
- **Privacy Requests (Right to Be Forgotten)**:
  - If a user requests deletion, compile and delete marketing and analytic profiles.
  - Transaction ledger history and identity verification records **must NOT** be deleted, as regulatory compliance laws override data deletion requests. These records will be marked as "Archived" and kept in a secure vault.
- **Travel Rule Integration**: For withdrawals exceeding $1,000 USD equivalent, the platform collects and transmits sender and receiver names, physical addresses, and account numbers to the receiving VASP (Virtual Asset Service Provider) via a Travel Rule protocol standard (e.g. TRISA or Netki).
- **Data Portability**: Provide a button on the UI for standard users to export their transaction history (trades, deposits, withdrawals) as a CSV or JSON file.
- **Market-Abuse Monitoring**: Log order cancel-to-fill ratios, wash-trading detections, and spoofing attempts.
