# Separate redesign test site

## What is protected

- Keep the existing Render service on **main**, with its current domain and database.
- All redesign commits go to **redesign**. Do not push these commits to main.
- Create a **new** Render Web Service. Do not change the branch of the live service.
- The test service gets a new Neon database, new session secret, and fictional data.
- Do not copy live users, horses, push subscriptions, device tokens, payment records or uploaded media.
- Do not connect the test service to a shared production environment group.
- Use the browser address of the new test service. Existing store apps and the Home Screen app still point at the live site.

## 1. Make an empty, separate database in Neon

1. In Neon, create a **new project** called `prohorsematch-redesign`.
   Do not make a branch/clone of the live database: that can copy real users.
2. In that new project, create a database named exactly **prohorsematch_redesign**.
3. Use a database role that has access only to this new test project.
4. Copy the PostgreSQL connection string for that database. Keep it private.
   Its database name must be `/prohorsematch_redesign`, not `/neondb`.
5. Do not touch the live project. There is no need to export or restore any live data.

The launcher checks the database name. Setup also refuses to initialise an existing
unmarked database containing tables. These safeguards do not replace carefully
selecting the new project and its separate role.

## 2. Create a NEW Render Web Service

In Render, choose **New → Web Service**, then the existing GitHub repository
`AusJumping/ProHorseMatch`.

| Setting | Value |
| --- | --- |
| Name | `prohorsematch-redesign` (or another available name) |
| Branch | **redesign** |
| Runtime | Node |
| Root directory | Leave blank |
| Build command | `npm ci --include=dev && npm run redesign:build` |
| Start command | `npm run redesign:start` |
| Health-check path | `/api/redesign-status` |

Choose the service size you want. A sleeping/free service, if available for your
account, can take longer to open. Review Render and Neon costs before creating them.
Do not add `prohorsematch.com` as a custom domain.
Render will assign this service its own `onrender.com` address; use the exact
address displayed in its dashboard.

Set these **only on the new service**:

| Environment variable | Value |
| --- | --- |
| `REDESIGN_DATABASE_URL` | The private connection string from the new Neon project |
| `SESSION_SECRET` | A new random secret of at least 32 characters; use Render's generator |
| `REDESIGN_DEMO_PASSWORD` | A new test-only password, at least 16 characters |
| `NODE_ENV` | `production` |

Do **not** add `DATABASE_URL`, `NEON_DATABASE_URL`, production environment groups,
email provider keys, VAPID keys, Firebase credentials, Stripe keys, or Cloudinary
credentials. The launcher supplies DATABASE_URL from REDESIGN_DATABASE_URL and
removes those outbound-service credentials from the running process.

Render's branch metadata is checked so this launcher refuses a main-branch deploy.
The app also refuses an ordinary start on Render's redesign branch; use the exact
start command above.

## 3. Deploy and check the test site

On the first start, the test service:

1. Checks the new database is empty.
2. Marks it as a redesign sandbox.
3. Creates the tables from the application's schema.
4. Adds three clearly labelled fictional horse listings and two verified demo accounts.

Log in using:

- Seller: `seller@redesign.invalid`
- Buyer: `buyer@redesign.invalid`
- Password for both: the value you chose for `REDESIGN_DEMO_PASSWORD`.

The sample listings use the app logo as a placeholder image. They are not copied
from live listings. Restarts preserve edits and do not recreate deleted samples or
reset passwords. Changing the environment password later does not reset existing
accounts automatically.

Open `/api/redesign-status` on the test address. It must say `"environment":"redesign"`
with outbound email and push set to false. Browse the three fictional horses, log
in as each demo role, and test saving, messaging and editing within this fake dataset.
Check Render's logs for successful sample setup and the email-disabled message.
Confirm the original Render service still shows **main**, its original database
settings and `prohorsematch.com`.

Email, web push and native push credentials are unavailable in the sandbox.
No verification or password-reset email will arrive: use the preverified demo
accounts. Payments and Cloudinary uploads/deletions are deliberately unavailable
too, to prevent accidental changes to live billing or media. UI testing for those
features will require separately configured test services later, never live keys.

The test site sends no-index headers and disallows crawlers. This is **not access
control**: its address can still be visited by anyone who knows it. Keep only fake
data there, keep the test login password private, and do not add real customers.

## 4. Work on the redesign

- Keep this workspace and GitHub on `redesign`.
- Push changes only to `redesign`. Configure automatic deploys for **the new
  Render service only**, if desired.
- Never change the production Render service's branch or environment settings.
- To run this workspace preview safely, securely add the test-only
  REDESIGN_DATABASE_URL, SESSION_SECRET and REDESIGN_DEMO_PASSWORD here too.
  `npm run dev` now uses the sandbox launcher and refuses to use an inherited
  DATABASE_URL. Until those test values exist, preview is intentionally blocked.
- Test schema changes apply only to the marked test database on startup. They
  can change/delete fake data. Do not copy this automatic schema command into
  the live service's start command.

## 5. Merge safely when the redesign is approved

1. Stop feature changes and run the automated tests and build on `redesign`.
2. Bring the latest main changes **into redesign**, resolve conflicts there,
   and retest on the separate Render address.
3. Back up the **live database** using your live provider's backup facilities.
   Check that you can restore it; a Git rollback does not restore database data.
4. Open a GitHub pull request **from redesign into main**. Review its complete
   diff, especially schema changes, payment/email code and mobile settings.
5. Prepare any live database schema changes separately. Prefer additive,
   backward-compatible changes. Never point the sandbox setup/seed command at
   production, and never copy the test database over the live database.
6. Review the sandbox tooling: it may remain in the repository, but the live
   service must continue using its existing normal build/start commands and its
   existing environment, with no REDESIGN_SANDBOX flag. The development command
   is intentionally sandbox-only; decide explicitly whether to keep that for
   future development. Do not merge changes to native server URLs pointing at
   the preview.
7. Agree on the release time. If the live service auto-deploys main, merging the
   pull request will trigger deployment. Pause auto-deploys first if you want a
   manual release; do that only when you're ready for the release, not now.
8. Merge only after approval, deploy main, and check login, search, listings,
   messaging and payment flows with appropriate test accounts.
9. Keep the previous deploy available for code rollback. A database migration
   needs its own rollback/restore plan.

Keep the redesign Render service/database separate after release, or delete only
those specifically named test resources when no longer needed.
