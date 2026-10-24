# Own-horse and conversation permissions

This is a follow-up to the historical findings in `behaviour-audit.html`,
implemented only on the redesign branch. No live data or account roles were
changed.

## Existing rules being enforced

- Any signed-in user, including a seller, may save another seller's horse.
  There is no new searching-role or paid-plan requirement.
- Owners cannot save or contact themselves about their own horse. This matches
  the existing horse-detail screen. Browse and reusable cards now hide the
  own-horse save control as well; listing/profile links remain available.
- A favourite belongs to its signed-in customer. Its customer and horse cannot
  be reassigned through the like/unlike endpoint. Repeated saves still update
  the same record.
- Old self-favourites can be unliked without migrating or deleting data.
- Both conversation creation/retrieval and message sending require the current
  user to be one of two distinct, existing participants. The supplied seller
  must own the specified existing horse.
- Either participant may initiate or retrieve a valid conversation. Sellers can
  enquire about other sellers' horses, and can reply as the owner of their own.
  Sender identity is derived from the authenticated user, not the request body.
- A block in either direction prevents creation/retrieval through the POST
  conversation endpoint and prevents sending, including in existing threads.
  Existing read/list/delete permissions are unchanged; blocking does not erase
  history or prevent an authorised participant from reading it.
- IDs accept positive integers or their decimal string equivalents. Invalid
  IDs and invalid message content are rejected before writes or notifications.

No payment, purchase, search, listing, subscription, or horse-management rules
were changed. Notification and unread tracking continue on successful sends.

## Regression checks

`node --test tests/horse-permissions.test.mjs tests/browse-screen.test.mjs`

Server tests execute the actual registered route bodies with isolated in-memory
storage and notification spies. They do not import application startup or use a
database. They cover buyer/seller success, outsiders, self-actions, forged
owners, missing accounts/listings, malformed inputs, both directions of blocking,
existing-thread reuse, favourite identity protection and old-favourite removal.
Browse rendering tests verify that an owner can still open their horse but
cannot save it, while other accounts retain the save control.
