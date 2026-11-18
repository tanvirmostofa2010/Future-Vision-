# Security Specification — Future Vision Capital (FVC)

## 1. Data Invariants
1. **Identity Integrity**: Every user-authored record (`ledger`, `forum_posts`, `forum_posts/{postId}/comments`, `audit_logs`) must record `authorUid == request.auth.uid` on creation, and `authorUid` is immutable after creation. Anonymous auth is rejected across all collections.
2. **Prevent Self-Escalation**: Users registering in `/users/{uid}` may only create a profile with `role == 'MEMBER'` unless created by an existing admin (`isAdmin()`) or the bootstrapped admin (`tanvirmostofa2010.maxbtl@gmail.com` with `email_verified == true`). Non-admins can never modify `role` or write `/admins/{uid}`.
3. **PII Isolation**: Sensitive fields (`mobile`, `email`, `presentAddress`, `permanentAddress`, `dob`, `fatherName`, `motherName`, `nomineeNid`) are stored exclusively in `/members_private/{memberId}` and are readable only by `isAdmin()` or the owning user (`resource.data.ownerUid == request.auth.uid`, or `email_verified == true` email match).
4. **Master Gate on Subcollections**: `/forum_posts/{postId}/comments/{commentId}` and `/forum_posts/{postId}/likes/{userId}` verify `exists(/databases/$(database)/documents/forum_posts/$(postId))`.
5. **Financial State & Immutability**: Non-admins can only create `ledger` entries with `status == 'PENDING'` and `authorUid == request.auth.uid`; only `isAdmin()` can transition `status` to `APPROVED` or `REJECTED`. Once `APPROVED` or `REJECTED`, non-admins cannot update or delete `ledger` entries.
6. **Append-Only Audit Trail**: `/audit_logs/{logId}` denies all updates and deletes (`allow update, delete: if false`).
7. **Temporal & Size Enforcement**: All `createdAt`/`updatedAt` fields require `request.time`, all IDs satisfy `^[a-zA-Z0-9_\-]+$` with `size() <= 128`, and all strings/arrays enforce strict `.size()` bounds.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated read** on `/members_public/FVC-001` (`auth == null`).
2. **Email Spoofing / Unverified Admin Email**: User with `token.email == 'tanvirmostofa2010.maxbtl@gmail.com'` and `email_verified == false` attempting admin write or reading `/members_private/FVC-001`.
3. **Role escalation on registration**: Non-admin creating `/users/uid1` with `role: "SUPER_ADMIN"`.
4. **Admin collection tampering**: Non-admin creating `/admins/uid1`.
5. **PII Blanket Read**: Member `uid2` attempting `get` or `list` on `/members_private/FVC-001` where `ownerUid != 'uid2'`.
6. **Shadow Ghost Field Injection**: Creating `/forum_posts/POST-999` with extra field `isOfficial: true` (blocked by `keys().hasOnly(...)`).
7. **Identity Spoofing**: Member `uid2` creating `/ledger/TXN-999` with `authorUid: "uid1"`.
8. **Financial Auto-Approval Bypass**: Non-admin creating `/ledger/TXN-999` with `status: "APPROVED"`.
9. **Terminal State Mutation**: Non-admin updating an `APPROVED` ledger entry.
10. **ID Poisoning**: Creating `/notices/invalid$$$id` or a 2KB document ID string.
11. **Client Timestamp Forgery**: Creating `/forum_posts/POST-999` with a backdated `createdAt` not equal to `request.time`.
12. **Audit Log Tampering**: Even an admin attempting to `update` or `delete` `/audit_logs/AUD-901`.
