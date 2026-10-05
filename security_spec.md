# DealMate Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity Isolation (`/users/{userId}`)**: A user profile document ID `{userId}` must strictly match `request.auth.uid` and `data.uid`. Because `email` is PII, `get` and `list` are restricted strictly to the document owner (`request.auth.uid == userId`) or a verified platform administrator (`isAdmin()`).
2. **Role Escalation Prevention**: Regular users can register only as `'user'` or `'store_owner'`. Self-assigning `'admin'` role is forbidden unless `isAdmin()` is true. During updates, `uid`, `email`, `role`, and `createdAt` are immutable for non-admins.
3. **Store Owner Inventory Integrity (`/storeProducts/{productId}`)**: Every store product must have `sellerId == request.auth.uid` on creation, positive price invariants (`minAcceptablePrice <= listPrice`), bounded string lengths, and `createdAt == request.time`. Only the owning `sellerId` or `isAdmin()` may update or delete a store product.
4. **Negotiation Record Immutability (`/negotiationRecords/{recordId}`)**: A negotiation record must be created by the authenticated buyer (`userId == request.auth.uid`) with `createdAt == request.time`. List queries must restrict `resource.data.userId == request.auth.uid` or `resource.data.sellerId == request.auth.uid` or `isAdmin()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection**: Adding `"isSuperAdmin": true` to `/users/{uid}` -> Rejected by `.keys().hasOnly(...)`.
2. **Privilege Escalation on Signup**: Creating `/users/{uid}` with `"role": "admin"` from a non-admin account -> Rejected by role gate.
3. **Cross-User Profile Read (PII Leak)**: Authenticated user `uid_A` attempting `get` on `/users/uid_B` -> Rejected by `isOwner(userId) || isAdmin()`.
4. **Unverified Email Spoofing**: Request with `email: "hvavinash2007@gmail.com"` but `email_verified: false` -> Rejected by `request.auth.token.email_verified == true`.
5. **ID Poisoning**: Creating `/storeProducts/{1500_char_id}` -> Rejected by `isValidId(productId)`.
6. **Denial of Wallet Oversized String**: Sending a 50KB `description` in `/storeProducts/{id}` -> Rejected by `data.description.size() <= 1000`.
7. **Orphaned / Spoofed Seller Product**: User `uid_A` creating a product with `sellerId: "uid_B"` -> Rejected by `data.sellerId == request.auth.uid`.
8. **Timestamp Forgery**: Creating a document with a past or future `createdAt` instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
9. **Immutable Field Tampering**: Updating `createdAt` or `sellerId` on an existing `/storeProducts/{id}` -> Rejected by immutability & `affectedKeys().hasOnly(...)`.
10. **Value Poisoning on Update**: Updating `listPrice` to a string `"free"` -> Rejected because `isValidStoreProduct(incoming())` wraps the `allow update` block.
11. **Terminal State Mutation**: Attempting to mutate a finalized `/negotiationRecords/{id}` after creation -> Rejected (`allow update, delete: if isAdmin()`).
12. **Blanket List Scraping**: Running an unfiltered `list` query on `/negotiationRecords` -> Rejected unless `resource.data.userId == request.auth.uid || resource.data.sellerId == request.auth.uid || isAdmin()`.
