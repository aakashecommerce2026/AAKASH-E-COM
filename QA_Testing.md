# AAKASH E-COM — QA Testing Overview

### MLM Enterprise Platform | Pre-Release Test Plan (Dev Stage: ~90% Complete)

---

## 1. Purpose & Scope

This document defines the QA testing strategy for AAKASH E-COM prior to release. The platform's risk is concentrated in **financial correctness** (commission math, payouts, TDS/fee deductions), **data isolation** (downline access), and **concurrency/idempotency** (async batch processing). Testing priority follows this risk profile — money-calculation and access-control bugs are release blockers; UI polish issues are not.

**In scope:** Backend (NestJS/Prisma/PostgreSQL/Redis), Frontend (React 19/MUI), API security, async payout processing, reporting exports.
**Out of scope (for this plan):** Third-party payment gateway certification, SMS/Email deliverability SLAs (covered separately if applicable).

---

## 2. Test Types & Coverage Strategy

| Test Type                           | Purpose                                                         | Priority |
| :---------------------------------- | :-------------------------------------------------------------- | :------- |
| **Unit Tests**                      | Commission %, rank threshold math, deduction formulas           | Critical |
| **Integration Tests**               | Recursive CTE upline traversal, ledger writes, guard logic      | Critical |
| **E2E Tests**                       | Registration → commission → rank → payout full lifecycle        | Critical |
| **Security Testing**                | DownlineAccessGuard bypass attempts, JWT tampering, rate limits | Critical |
| **Concurrency/Idempotency Testing** | Duplicate commission prevention under parallel load             | Critical |
| **Load/Performance Testing**        | Deep tree (20-level) traversal & dashboard load                 | High     |
| **Regression Testing**              | Re-verify after each config/rate change                         | High     |
| **UAT**                             | Admin & member workflows against real business rules            | High     |
| **Accessibility/UI**                | MUI components, responsive layout                               | Medium   |

---

## 3. Module-by-Module Test Plan

### 3.1 Membership Commission Engine (20-Level)

**What must be verified:**

- Correct percentage applied at every level per the schedule (L1: 10%, L2: 5%, L3: 2.5%, L4: 1.5%, L5: 1.0%, L6: 0.75%, L7–L20: 0.5% each).
- Total distributed never exceeds 25.75% of package amount, regardless of tree depth.
- If the sponsor tree has fewer than 20 uplines (e.g., a level-3 member registers a new member), commission correctly terminates at the root — no errors, no orphaned records.
- Recursive CTE performance and correctness on very deep/wide trees.
- Idempotency: re-triggering the same registration event does not create duplicate ledger rows (unique key: `sourceMemberId + level`).

**Key test cases:**
| ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| MC-01 | New member registers with default ₹10,000 package, full 20-level upline exists | Each of 20 uplines receives exact ₹ amount per schedule table |
| MC-02 | Custom package amount (e.g., ₹25,000) | Percentages applied correctly to custom base, not hardcoded to ₹10,000 |
| MC-03 | Sponsor tree only 5 levels deep | Only 5 ledger entries created; no failure on missing levels 6–20 |
| MC-04 | Retry/replay same registration webhook or duplicate API call | No duplicate ledger entries (idempotency key enforced) |
| MC-05 | Upline member has `isCommissionFrozen = true` | That member's commission lands in `HOLD`, not `PENDING` |
| MC-06 | Upline member `status != ACTIVE` | Commission goes to `HOLD` |
| MC-07 | Concurrent registrations from siblings under the same sponsor | No race condition causing double-credit or lost credit to shared uplines |
| MC-08 | Rounding edge cases (e.g., odd package amounts producing fractional paise) | Consistent rounding rule applied and documented (no silent truncation drift across 20 levels) |

---

### 3.2 Repurchase Commission Engine (20-Level)

**Key test cases:**
| ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| RC-01 | Member places repurchase order, full upline active | Commission distributed across 20 levels per configured repurchase schedule |
| RC-02 | Duplicate `RepurchaseEntry` transaction reference submitted twice | Composite unique constraint `(repurchaseEntryId, level)` blocks double-crediting |
| RC-03 | Frozen/inactive upline beneficiary | Commission routed to `HOLD` status |
| RC-04 | Versioned rate config changes mid-cycle | New repurchases use new rates; historical ledgers remain unaffected (no retroactive rewrite) |
| RC-05 | High-volume repurchase burst (load test) | Queue processes without dropped or duplicated commission jobs |

---

### 3.3 Rank Promotion Engine

**Key test cases:**
| ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| RP-01 | Member reaches exactly 20 active direct referrals | Auto-promoted NONE → BRONZE immediately; `PromotionHistory` + audit log entry created |
| RP-02 | Member reaches exactly 50, 90, 130 active referrals | Auto-promoted to SILVER, GOLD, PLATINUM respectively |
| RP-03 | Referral count drops below threshold (e.g., a direct becomes BLOCKED) | Confirm business rule: does rank downgrade or stay locked? (Flag if undefined in spec — needs product clarification) |
| RP-04 | Referral crosses two thresholds in one event (bulk activation) | Correct single-step promotion to the right rank, not skipped or double-logged |
| RP-05 | Only _direct_ referrals count, not full downline | Verify indirect/deep downline activations do NOT affect rank |
| RP-06 | Concurrent activations pushing count to threshold simultaneously | No duplicate promotion events for the same milestone |

---

### 3.4 Payout & Distribution Engine

**Deduction formula to verify exactly:**

```
Gross = ΣPending Membership Commissions + ΣPending Repurchase Commissions
TDS (5%) = Gross × 0.05          (toggleable)
Admin Fee (5%) = Gross × 0.05    (toggleable)
Net Payout = Gross − TDS − Admin Fee
```

**Key test cases:**
| ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| PD-01 | Batch initiated with cutoff date | Only ledgers dated on/before cutoff included |
| PD-02 | Batch initiated with explicit selected ledger IDs | Only specified ledgers processed, others untouched |
| PD-03 | TDS toggle OFF via SystemSetting | Net Payout = Gross − Admin Fee only |
| PD-04 | Admin Fee toggle OFF | Net Payout = Gross − TDS only |
| PD-05 | Both toggles OFF | Net Payout = Gross Amount, no deductions |
| PD-06 | Batch with zero matching records | State transitions to `FAILED` with clear reason logged |
| PD-07 | Worker crash/exception mid-processing | Batch marked `FAILED`; already-processed records don't get reprocessed on retry (no double-payout) |
| PD-08 | Batch completes successfully | All matched ledgers move to `DISBURSED`; member SMS/Email notifications fire exactly once |
| PD-09 | Two batches triggered concurrently with overlapping ledger sets | Row-level locking prevents same ledger being paid out twice |
| PD-10 | Member has both `PENDING` and `HOLD` commissions | Only `PENDING` included in Gross; `HOLD` excluded until unfrozen |

---

### 3.5 Security & Access Control

#### DownlineAccessGuard

| ID     | Scenario                                                                         | Expected Result                                                     |
| :----- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| SEC-01 | MEMBER attempts to query a `memberId` outside their downline                     | 403 Forbidden                                                       |
| SEC-02 | MEMBER queries their own direct downline (level 1)                               | Allowed                                                             |
| SEC-03 | MEMBER queries a deep downline member (level 15+)                                | Allowed if genuinely in their tree                                  |
| SEC-04 | MEMBER attempts to query a sibling's downline (same sponsor, not their own tree) | 403 Forbidden                                                       |
| SEC-05 | ADMIN/SUB_ADMIN queries any member                                               | Allowed (bypass confirmed)                                          |
| SEC-06 | Manipulated JWT payload with forged `memberId`/role claim                        | Rejected — signature validation catches tampering                   |
| SEC-07 | `isInDownlineOf` performance on a 20-level, wide tree                            | Query completes within acceptable latency (define SLA, e.g. <300ms) |

#### Rate Limiting

| ID     | Scenario                                                                              | Expected Result                  |
| :----- | :------------------------------------------------------------------------------------ | :------------------------------- |
| SEC-08 | 31st request within 1 second                                                          | Throttled (short window: 30/sec) |
| SEC-09 | 151st request within 10 seconds                                                       | Throttled (medium window)        |
| SEC-10 | 501st request within 1 minute                                                         | Throttled (long window)          |
| SEC-11 | Legitimate burst traffic (e.g., dashboard loading multiple widgets) just under limits | Not falsely throttled            |

#### General

| ID     | Scenario                                       | Expected Result                                                           |
| :----- | :--------------------------------------------- | :------------------------------------------------------------------------ |
| SEC-12 | Password stored/compared                       | Bcrypt hash verified, plaintext never logged or returned in API responses |
| SEC-13 | Expired JWT used                               | 401, forces re-authentication                                             |
| SEC-14 | CORS request from unauthorized origin          | Blocked                                                                   |
| SEC-15 | OTP reuse/replay after successful verification | OTP invalidated after first use; cannot be reused                         |
| SEC-16 | OTP brute-force attempt                        | Locked out / rate-limited per attempt threshold                           |

---

### 3.6 Data Integrity & Database

| ID    | Scenario                                                                                     | Expected Result                                                                   |
| :---- | :------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| DB-01 | Two parallel requests attempt to insert the same `(sourceMemberId, level)` membership ledger | Unique constraint rejects the duplicate; no silent overwrite                      |
| DB-02 | Two parallel requests attempt same `(repurchaseEntryId, level)`                              | Same protection for repurchase ledger                                             |
| DB-03 | `referrerId` self-reference chain is corrupted or circular (data integrity edge case)        | System detects and prevents infinite recursion in CTE, or fails gracefully        |
| DB-04 | `ActivityLog` immutability                                                                   | No update/delete path exists on audit records (API and DB level)                  |
| DB-05 | `SystemSetting` value changed mid-transaction                                                | Reads are consistent within a single request/transaction (no partial application) |

---

### 3.7 Frontend Modules

| Page/Component                | Key Test Focus                                                                                                                      |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `MemberManagement.jsx`        | Search/filter accuracy, status toggle reflects backend state immediately, rank promotion UI matches actual rank                     |
| `CommissionEngineConsole.jsx` | Rate config changes are versioned (old rates preserved for historical ledgers), validation prevents totals >100% or negative values |
| `Commissions.jsx`             | Ledger status filters (PENDING/HOLD/DISBURSED) return correct data per logged-in role and downline scope                            |
| `PayoutConsole.jsx`           | Batch initiation UI reflects real-time batch state transitions (INITIATED → PROCESSING → COMPLETED/FAILED)                          |
| `RepurchasePanel.jsx`         | Duplicate transaction reference submission is blocked client-side and server-side                                                   |
| `UnilevelTree.jsx`            | Renders correctly at full 20-level depth without performance degradation or truncation                                              |
| `DashboardCharts.jsx`         | Figures match backend ledger sums exactly (no client-side calculation drift)                                                        |
| `ResetPassword.jsx`           | OTP flow: expiry, resend cooldown, invalid OTP handling                                                                             |
| Excel/PDF Exports             | Exported figures match on-screen and database values exactly; large exports (deep trees) don't time out                             |

---

## 4. Critical Edge Cases (Cross-Cutting)

These deserve dedicated focus sessions, not just inline test cases:

1. **Money precision** — Decimal(12,2) handling across 20-level splits; confirm no floating-point drift and that percentage sums are audited to reconcile exactly against Gross Amount.
2. **Idempotency under retry** — Simulate network timeouts/retries on registration, repurchase, and payout initiation endpoints; confirm no duplicate financial records anywhere.
3. **Frozen/blocked member commission flow** — End-to-end trace of a HOLD commission: does it un-freeze correctly and become payable once status is restored?
4. **Batch failure recovery** — Kill the worker process mid-batch; verify no partial/double disbursement on restart.
5. **Deep tree performance** — Seed a 20-level, wide tree (`npm run seed:tree`) and load-test dashboard + tree visualization + CTE-based commission calc together.
6. **Role boundary testing** — SUB_ADMIN scope: confirm it has the intended subset of ADMIN privileges (spec doesn't fully define the SUB_ADMIN boundary — flag for clarification).

---

## 5. Environments, Tools & Data

| Item                        | Recommendation                                                                                                         |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Test Environment**        | Isolated staging DB seeded via `npm run seed:tree --prefix backend`                                                    |
| **Backend Unit Tests**      | `npm test --prefix backend` (Jest, assumed under NestJS convention)                                                    |
| **Load Testing**            | `npm run load-test:dashboard --prefix backend` for dashboard; extend equivalent for payout batch and commission engine |
| **Deployment Verification** | `npm run verify:deployment` before every QA cycle — confirms DB connectivity, Redis health, build artifacts            |
| **API Testing**             | Swagger/OpenAPI spec as the contract source for automated API test suites                                              |
| **Security Testing**        | Manual JWT tampering + automated rate-limit test scripts                                                               |
| **Concurrency Testing**     | Scripted parallel requests (e.g., k6 or Artillery) against registration/repurchase/payout endpoints                    |

---

## 6. Test Execution Phases

| Phase                                | Focus                                                                                                                     | Suggested Order                             |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------ |
| **Phase 1 — Unit & Component**       | Commission math, deduction formulas, rank thresholds                                                                      | Run continuously in CI                      |
| **Phase 2 — Integration**            | Ledger writes, guard logic, CTE traversal, batch state machine                                                            | Before each staging deploy                  |
| **Phase 3 — Security & Concurrency** | Downline isolation, rate limits, idempotency under load                                                                   | Dedicated hardening sprint                  |
| **Phase 4 — E2E & UAT**              | Full lifecycle: register → commission → rank → repurchase → payout batch → disbursement, from both MEMBER and ADMIN views | Pre-release                                 |
| **Phase 5 — Performance/Load**       | Deep tree + high-volume batch processing                                                                                  | Pre-release, on staging matching prod specs |
| **Phase 6 — Regression**             | Re-run full suite after any commission rate/config change                                                                 | Ongoing                                     |

---

## 7. Open Items to Clarify with Product Before Sign-Off

- Does rank **downgrade** if active referral count drops, or is promotion permanent?
- Exact **rounding rule** for commission calculations (round half up, banker's rounding, truncate?).
- **SUB_ADMIN** permission boundary — full spec not detailed in current documentation.
- SLA targets for downline query latency and dashboard load at max tree depth.
- Retry/backoff policy for failed Bull Queue jobs — how many attempts before a commission/payout job is considered permanently failed?

---

## 8. Suggested Exit Criteria (Release Readiness)

- ✅ All Critical-priority test cases (commission math, idempotency, access isolation, payout deductions) pass with zero open defects.
- ✅ No duplicate financial records reproducible under any retry/concurrency scenario tested.
- ✅ Load test confirms acceptable performance at 20-level depth under realistic concurrent user load.
- ✅ Security test pass on DownlineAccessGuard, rate limiting, and JWT handling.
- ✅ All "Open Items" above resolved and reflected in test cases.
- ✅ Full E2E regression pass on staging matching production configuration.

---

_QA Testing Overview prepared from AAKASH E-COM Product Specifications & Technical Report._
