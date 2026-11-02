# Legacy helper permission boundary

These changes are branch-only. Do not call reset/cleanup/rebuild helpers against
production or deploy them as part of testing.

- All `/api/admin/*`, `/api/test/*` and the conversation-reminder trigger require
  the existing administrator identity, checked from storage, not seller status.
- The shared boundary accepts existing sessions or current auth tokens. An
  explicitly supplied invalid token is rejected even if an admin session exists.
- Anonymous requests receive 401. Signed-in non-administrators receive 403,
  before helper reads, writes, email or push sending.
- Legacy horse-management helpers use the authenticated administrator ID and no
  longer require the administrator to also be a seller.
- Server startup no longer creates an administrator. Existing accounts still
  using the retired built-in seed password are denied administrative and media
  override access, whether the password is stored as legacy plaintext or a bcrypt
  hash, even with a valid token/session. The owner must reset that password using
  the existing recovery flow; these changes do not modify stored credentials.
- Image deletion requires an existing user and either administrator access,
  ownership of every listing referencing that image, or ownership of a new,
  unsaved upload. Cross-user upload namespaces never grant deletion rights.
- New uploads are namespaced by authenticated user and media type. Existing
  image URLs are unchanged. Unlinked legacy uploads have no reliable ownership
  evidence and are administrator-only. Videos are not deleted through the image
  endpoint.

Run `node --test tests/admin-media-permissions.test.mjs` without application
credentials. It compiles permission modules and extracts selected route bodies
without importing server startup, uses fictional storage, and stubs all media
deletion. HTTP requests target only ephemeral local test servers.

The configured workspace preview proxies an existing isolated test API. Restarting
that preview does not deploy backend permission changes to the test service.
