# Zero-Trust Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth
1. **Global Default-Deny**: All paths not explicitly matched under `/databases/{database}/documents` default to `allow read, write: if false;`.
2. **Verified Identity Gate**: Every mutating operation (`create`, `update`, `delete`) requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: Every single-document path variable (`{userId}`, `{auditId}`, `{orderId}`) is validated via `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **PII & Owner Isolation**:
   - `/users/{userId}` contains operator email (`UserProfile`). Read and write access is strictly isolated to `request.auth.uid == userId` or `isAdmin()`.
   - `/storeAudits/{auditId}` and `/storeOrders/{orderId}` require `ownerId == request.auth.uid` on creation, enforce `ownerId` immutability on update, and restrict `list` / `get` queries to `resource.data.ownerId == request.auth.uid || isAdmin()`.
5. **Temporal Integrity & Terminal State Locking**:
   - `createdAt == request.time` on `create`; `createdAt == resource.data.createdAt` and `updatedAt == request.time` on `update`.
   - Once `status` reaches terminal state (`'archived'` for `storeAudits`, `'completed'` for `storeOrders`), further non-admin updates are blocked.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Shadow Field Injection)**: `create` on `/storeAudits/audit_1` with `{ ..., isSuperAdmin: true }` -> Rejected by `keys().hasOnly(...)`.
2. **Payload 2 (Identity Spoofing)**: `create` on `/storeAudits/audit_1` where `ownerId != request.auth.uid` -> Rejected by `data.ownerId == request.auth.uid`.
3. **Payload 3 (Unverified Email Spoof)**: Write with `request.auth.token.email == 'hampusi97@gmail.com'` but `email_verified == false` -> Rejected by `isVerifiedUser()`.
4. **Payload 4 (Path ID Poisoning)**: `create` on `/storeAudits/invalid$id!with@spaces` -> Rejected by `isValidId(auditId)`.
5. **Payload 5 (Denial of Wallet String Overflow)**: `create` on `/storeAudits/audit_1` with 10,000-char `summary` -> Rejected by `data.summary.size() <= 500`.
6. **Payload 6 (PII Blanket Read)**: Authenticated user `user_B` attempts `get` on `/users/user_A` -> Rejected by `isOwner(userId)`.
7. **Payload 7 (Unauthorized List Scraping)**: Authenticated user executes unfiltered `list` on `/storeOrders` -> Rejected because `allow list` requires `resource.data.ownerId == request.auth.uid`.
8. **Payload 8 (Owner Reassignment on Update)**: `update` on `/storeAudits/audit_1` mutating `ownerId` -> Rejected by `affectedKeys().hasOnly(...)` and `incoming().ownerId == existing().ownerId`.
9. **Payload 9 (Timestamp Forgery)**: `create` on `/storeOrders/ord_1` with past/future `createdAt` -> Rejected by `incoming().createdAt == request.time`.
10. **Payload 10 (Terminal State Re-opening)**: `update` on `/storeOrders/ord_1` when `resource.data.status == 'completed'` -> Rejected by terminal state guard `existing().status != 'completed'`.
11. **Payload 11 (Value Poisoning on Update)**: `update` on `/storeAudits/audit_1` setting `auditScore` to `"high"` or `9999` -> Rejected because `isValidStoreAudit(incoming())` wraps the entire `allow update` block and enforces `auditScore is number && auditScore >= 0 && auditScore <= 100`.
12. **Payload 12 (Immortal Field Mutation)**: `update` on `/storeOrders/ord_1` changing `createdAt` or `orderNumber` -> Rejected by immutability guards.
