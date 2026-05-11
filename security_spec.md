# Security Specification - Chat Hotel

## 1. Data Invariants
- All documents must be accessible only by authorized administrators.
- `cat_id` in a `Stay` must point to a valid `Cat`.
- `stay_id` in `HealthLog`, `Invoice`, or `Media` must point to a valid `Stay`.
- Timestamps must be valid ISO strings (validated by regex or presence).
- Document IDs must be alphanumeric and of reasonable size.

## 2. The "Dirty Dozen" Payloads

### Payload 1: Unauthorized Client Write
Attempt to create a client document without any authentication.
```json
{
  "name": "Hack Er",
  "email": "hacker@evil.com"
}
```
**Expected: PERMISSION_DENIED**

### Payload 2: Non-Admin Write
Attempt to create a cat document as a logged-in user who is not in the `admins` collection.
```json
{
  "owner_id": "client123",
  "name": "Whiskers"
}
```
**Expected: PERMISSION_DENIED**

### Payload 3: Shadow Field Injection
Attempt to add a `is_verified_admin: true` field to a client document.
```json
{
  "name": "John Doe",
  "is_verified_admin": true
}
```
**Expected: PERMISSION_DENIED (Strict keys)**

### Payload 4: ID Poisoning
Attempt to create a stay with a 2MB string as ID.
**Expected: PERMISSION_DENIED**

### Payload 5: Invalid Data Type
Attempt to set `box_number` as a string instead of a number.
```json
{
  "cat_id": "cat123",
  "box_number": "one",
  "arrival_date": "2024-01-01",
  "planned_departure": "2024-01-05"
}
```
**Expected: PERMISSION_DENIED**

### Payload 6: Orphaned Stay
Attempt to create a stay for a `cat_id` that does not exist.
**Expected: PERMISSION_DENIED**

### Payload 7: Update Immutables
Attempt to change `owner_id` of a `Cat` after creation.
**Expected: PERMISSION_DENIED**

### Payload 8: PII Leak via List
Attempt to list all clients as a non-authenticated user.
**Expected: PERMISSION_DENIED**

### Payload 9: Size Exhaustion
Attempt to save a 1MB string into a `comments` field.
**Expected: PERMISSION_DENIED**

### Payload 10: State Shortcut
Attempt to mark an invoice as `paid` directly during creation (if logic expects `draft` first).
**Expected: PERMISSION_DENIED**

### Payload 11: Cross-Stay Injection
Attempt to create a `HealthLog` with a `stay_id` belonging to a different owner/cat (not applicable for global admin but good for structure).
**Expected: PERMISSION_DENIED**

### Payload 12: Media Type Hijack
Attempt to upload a `Media` document with `type: "shady-executable"`.
**Expected: PERMISSION_DENIED**

## 3. Test Runner Placeholder
(Tests will be implemented in `firestore.rules.test.ts`)
