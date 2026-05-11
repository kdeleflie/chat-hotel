# Security Specification for Kanine App

## Data Invariants
1. **User Ownership**: All data (Clients, Appointments, Invoices) is nested under a `userId` in the path. Access is strictly limited to the user whose `auth.uid` matches the `{userId}` path variable.
2. **Identity Integrity**: The `uid` field in any document must strictly match the `request.auth.uid`.
3. **Immutability**: Document IDs (`id`) and owner IDs (`uid`) are immutable after creation.
4. **Type Safety**: All fields must match their expected types (string, number, boolean, array).
5. **Sanitization**: Strings must have size limits to prevent abuse.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a client with a `uid` that doesn't match `request.auth.uid`.
2. **Cross-User Access**: User A attempts to read User B's clients.
3. **Shadow Update**: Attempt to update a client with an extra field `isAdmin: true`.
4. **ID Poisoning**: Attempt to create a client with a 2KB string as document ID.
5. **Resource Exhaustion**: Attempt to save a note with 1MB of text.
6. **Immutable Field Write**: Attempt to change the `uid` of an existing client.
7. **Invalid Type**: Attempt to save `weight` as a string instead of a number.
8. **Malicious Enum**: Attempt to set `sex` to 'X' instead of 'M' or 'F'.
9. **Missing Required Field**: Attempt to save a client without the `name` field.
10. **Timestamp Fraud**: Attempt to set `updatedAt` to a future date instead of `request.time`.
11. **Relational Orphan**: (Not applicable as we don't have hard cross-collection links yet, but let's say creating an invoice for a non-existent client).
12. **Blanket Query**: Attempt to list ALL clients in the system without a `userId` filter.

## Test Runner
Stored in `firestore.rules.test.ts`.
