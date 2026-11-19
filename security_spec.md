# Firestore Security Specification (`linkme.bio`)

## 1. Data Invariants
1. Every document in `/profiles/{handle}` MUST have `handle` equal to the normalized document ID `{handle}` (`^[a-z0-9][a-z0-9._-]{0,38}[a-z0-9]$`).
2. `createdAt` is immutable once written and MUST equal `request.time` at creation. `updatedAt` MUST equal `request.time` on every create and update.
3. No ghost/shadow fields may exist on `/profiles/{handle}` or `/profiles/{handle}/messages/{messageId}` (`hasAll` + `hasOnly` enforced on create; `affectedKeys().hasOnly(...)` on every update action).
4. Unauthenticated visitors (`request.auth == null`) CANNOT claim `ownerUid` or overwrite an already-claimed profile (`existing().ownerUid != null`).
5. Visitor PII (`senderEmail` in `/profiles/{handle}/messages/{messageId}`) is strictly isolated from public `/profiles/{handle}` reads and can only be listed/read by the verified profile owner or bootstrapped admin (`lucquixada@gmail.com`).
6. Every string field and array (`socials <= 20`, `blocks <= 50`) enforces strict `.size()` upper bounds to prevent Denial-of-Wallet / 1MB document overflow attacks.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Shadow Field Injection on Create**: `/profiles/test.user` create payload containing `{ ..., isSuperAdmin: true }` -> rejected by `hasOnly(...)`.
2. **Oversized Handle / ID Poisoning**: `/profiles/${'a'.repeat(300)}` -> rejected by `isValidHandleId(handle)`.
3. **Handle Mismatch**: Document `/profiles/alpha.bio` created with `handle: "beta.bio"` -> rejected by `incoming().handle == handle`.
4. **Spoofed Owner UID on Unauthenticated Create**: Create `/profiles/hijack` with `ownerUid: "victim_uid_123"` while signed out -> rejected.
5. **Overwrite Locked Profile**: Unauthenticated or non-owner update of `/profiles/protected.bio` where `existing().ownerUid == "alice_uid"` -> rejected.
6. **Admin Spoofing via Unverified Email**: Signed-in token with `email: "lucquixada@gmail.com"` and `email_verified: false` -> rejected by `request.auth.token.email_verified == true`.
7. **Timestamp Forgery**: Create/update passing client timestamp `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> rejected.
8. **Immutable Field Tampering**: Update attempting to modify `createdAt` or `handle` -> rejected.
9. **Oversized Blocks Array (DoW)**: Profile write with `blocks` array of 51+ items -> rejected by `data.blocks.size() <= 50`.
10. **Ghost Field on Update**: Profile update including `affectedKeys` outside allowlist (e.g. modifying `views` + `displayName` simultaneously outside admin) -> rejected.
11. **Orphaned Message Creation**: Write to `/profiles/nonexistent.bio/messages/msg_1` -> rejected by `exists(/databases/$(database)/documents/profiles/$(handle))`.
12. **PII Leak Attempt**: Unauthenticated or non-owner `get` or `list` on `/profiles/elena.studio/messages` -> rejected.
