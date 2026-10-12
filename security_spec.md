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
12. **Blanket List Scraping**: Running an unfiltered `list` query on `/negotiationRecords` or `/orders` -> Rejected unless `resource.data.userId == request.auth.uid || resource.data.sellerId == request.auth.uid || resource.data.buyerUserId == request.auth.uid || isAdmin()`.

## 3. Phase 1 Codebase Analysis & Collection Mapping
Comprehensive audit of all Firestore access points across `src/` and `server.ts`:

1. `/test/connection`
   - **Access**: Read-only boot healthcheck (`testConnection()` in `src/firebase.ts`).
   - **Rules**: `allow get: if true; allow list, write: if false;`

2. `/admins/{adminId}`
   - **Access**: Server & RBAC authority mapping.
   - **Rules**: `allow get: if isVerifiedUser() && (request.auth.uid == adminId || isAdmin()); allow list: if isAdmin(); allow write: if false;`

3. `/users/{userId}`
   - **Entity**: `UserProfile`
   - **Access**: `src/components/auth/SignInPage.tsx:210` (`syncUserToFirestore`).
   - **Rules**: Strictly isolated to `isOwner(userId) || isAdmin()`. Admin role self-escalation forbidden. `uid`, `email`, `createdAt` immutable.

4. `/storeProducts/{productId}`
   - **Entity**: `StoreProduct`
   - **Access**: `src/App.tsx:401` (`query(collection(db, 'storeProducts'), where('stock', '>=', 0))`) and `src/components/storeOwner/StoreOwnerPortal.tsx:415`.
   - **Rules**: Public/Signed-in get/list restricted by `resource.data.stock >= 0`. Create/Update restricted to owning store owner (`incoming().sellerId == request.auth.uid`).

5. `/categoryNegotiationSettings/{settingId}`
   - **Entity**: `CategoryNegotiationSetting`
   - **Access**: `src/App.tsx:473` (`query(collection(db, 'categoryNegotiationSettings'), where('maxSingleDiscountPct', '>=', 0))`) and `src/components/storeOwner/StoreOwnerPortal.tsx:335`.
   - **Rules**: Public get/list restricted by `resource.data.maxSingleDiscountPct >= 0`. Create/Update restricted to owning store owner (`incoming().sellerId == request.auth.uid`). Includes `bulkTiers` support.

6. `/negotiationRecords/{recordId}`
   - **Entity**: `NegotiationRecord`
   - **Access**: `src/App.tsx:822` (`setDoc(doc(db, 'negotiationRecords', recordId), ...)`).
   - **Rules**: Terminal immutable record created by authenticated buyer (`incoming().userId == request.auth.uid`). Read/list restricted to buyer, seller, or admin. Updates forbidden except by admin.

7. `/orders/{orderId}`
   - **Entity**: `OrderRecord`
   - **Access**: `src/services/orderService.ts:10`, `src/services/orderService.ts:53` (`query(collection(db, 'orders'), where('buyerUserId', '==', buyerUserId))`), and `server.ts:35`.
   - **Rules**: PII Isolation: Reads restricted to buyer (`resource.data.buyerUserId == request.auth.uid`), seller (`resource.data.sellerId == request.auth.uid`), or `isAdmin()`. Blanket list scraping forbidden.

## 4. Phase 2: Role Access Matrix & Authorizations

| Collection Path | Operation | Anonymous / Unverified | Authenticated User | Store Owner | Platform Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/test/connection` | `get` | Allowed | Allowed | Allowed | Allowed |
| `/test/connection` | `list`, `write` | Denied | Denied | Denied | Denied |
| `/admins/{adminId}` | `get` | Denied | Denied (unless self or admin) | Denied (unless self or admin) | Allowed |
| `/admins/{adminId}` | `list` | Denied | Denied | Denied | Allowed |
| `/admins/{adminId}` | `write` | Denied | Denied | Denied | Denied (immutable via rules) |
| `/users/{userId}` | `get` | Denied | Allowed if `uid == userId` | Allowed if `uid == userId` | Allowed |
| `/users/{userId}` | `list` | Denied | Allowed if `uid == resource.data.uid` | Allowed if `uid == resource.data.uid` | Allowed |
| `/users/{userId}` | `create` | Denied | Allowed (role: user/store_owner) | Allowed (role: user/store_owner) | Allowed (all roles) |
| `/users/{userId}` | `update` | Denied | Allowed (own profile, immutable uid/email/createdAt) | Allowed (own profile & storeName) | Allowed |
| `/users/{userId}` | `delete` | Denied | Denied | Denied | Allowed |
| `/storeProducts/{productId}` | `get`, `list` | Allowed (`stock >= 0`) | Allowed (`stock >= 0`) | Allowed (`stock >= 0`) | Allowed (`stock >= 0`) |
| `/storeProducts/{productId}` | `create` | Denied | Denied (must be seller) | Allowed (`sellerId == auth.uid`) | Allowed |
| `/storeProducts/{productId}` | `update` | Denied | Denied | Allowed (own product, immutable id/sellerId/createdAt) | Allowed |
| `/storeProducts/{productId}` | `delete` | Denied | Denied | Allowed (own product) | Allowed |
| `/negotiationRecords/{recordId}` | `get`, `list` | Denied | Allowed (if buyer `userId == auth.uid`) | Allowed (if seller `sellerId == auth.uid`) | Allowed |
| `/negotiationRecords/{recordId}` | `create` | Denied | Allowed (`userId == auth.uid`, status DEAL_ACCEPTED/PURCHASED) | Denied for arbitrary records | Allowed |
| `/negotiationRecords/{recordId}` | `update`, `delete` | Denied | Denied (Terminal audit record) | Denied | Allowed |
| `/categoryNegotiationSettings/{settingId}` | `get`, `list` | Allowed (`maxSingleDiscountPct >= 0`) | Allowed (`maxSingleDiscountPct >= 0`) | Allowed (`maxSingleDiscountPct >= 0`) | Allowed |
| `/categoryNegotiationSettings/{settingId}` | `create`, `update` | Denied | Denied | Allowed (`sellerId == auth.uid`, discount <= 40, bulkTiers <= 10) | Allowed |
| `/categoryNegotiationSettings/{settingId}` | `delete` | Denied | Denied | Allowed (own setting) | Allowed |
| `/orders/{orderId}` | `get` | Denied (unless unassigned) | Allowed (if buyer `buyerUserId == auth.uid`) | Allowed (if seller `sellerId == auth.uid`) | Allowed |
| `/orders/{orderId}` | `list` | Denied | Allowed (if buyer `buyerUserId == auth.uid`) | Allowed (if seller `sellerId == auth.uid`) | Allowed |
| `/orders/{orderId}` | `create` | Allowed (guest order without buyerUserId) | Allowed (`buyerUserId == auth.uid`) | Allowed (`buyerUserId == auth.uid`) | Allowed |
| `/orders/{orderId}` | `update` | Denied | Allowed (if buyer `buyerUserId == auth.uid`) | Allowed (if seller `sellerId == auth.uid`) | Allowed |
| `/orders/{orderId}` | `delete` | Denied | Denied | Denied | Allowed |

## 5. Phase 3: Rule Logic Audit & Verification Summary
- **Pillar 1 (Global Deny-All)**: `match /{document=**} { allow read, write: if false; }` mounted at root.
- **Pillar 2 (Safe IDs)**: Validated on all write and doc match selectors via `isValidId()`.
- **Pillar 3 (Type & Boundary Assertions)**: Every field in all 5 entities checked for type, length, value range, and enumerated status strings.
- **Pillar 4 (Whitelisting & Anti-Injection)**: `hasAll()` + `hasOnly()` checks applied across `UserProfile`, `StoreProduct`, `NegotiationRecord`, `CategoryNegotiationSetting`, and `OrderRecord`.
- **Pillar 5 (Immutability)**: Key fields (`uid`, `sellerId`, `createdAt`, `id`) safeguarded via `.diff(existing()).affectedKeys().hasOnly(...)`.
- **Pillar 6 (PII & Anti-Scraping)**: User profiles, orders, and negotiation audit trails restrict direct reads and list iterations to the specific party UID or admin.
- **Syntax & Schema Verification**: Fully validated; clean compilation and zero TypeScript or AST discrepancies.


