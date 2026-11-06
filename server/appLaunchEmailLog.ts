// Remembers who has already been sent a launch email, so nobody can get it twice (re-click, restart, retry).
// The table is created on first use with CREATE TABLE IF NOT EXISTS: it only adds, it never changes existing tables.
import { sql } from "drizzle-orm";
import { db } from "./db";

let ready: Promise<void> | null = null;

export function ensureLogTable(): Promise<void> {
  if (!ready) {
    ready = db
      .execute(sql`CREATE TABLE IF NOT EXISTS app_launch_email_log (
        campaign text NOT NULL,
        user_id integer NOT NULL,
        email text NOT NULL,
        sent_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (campaign, user_id)
      )`)
      .then(() => undefined)
      .catch((error) => { ready = null; throw error; });
  }
  return ready;
}

export async function sentUserIds(campaign: string): Promise<Set<number>> {
  await ensureLogTable();
  const result: any = await db.execute(sql`SELECT user_id FROM app_launch_email_log WHERE campaign = ${campaign}`);
  return new Set<number>((result.rows ?? []).map((row: any) => Number(row.user_id)));
}

// Reserve a recipient before sending. Returns false if somebody already reserved or sent to them.
export async function claimRecipient(campaign: string, userId: number, email: string): Promise<boolean> {
  await ensureLogTable();
  const result: any = await db.execute(
    sql`INSERT INTO app_launch_email_log (campaign, user_id, email) VALUES (${campaign}, ${userId}, ${email}) ON CONFLICT DO NOTHING RETURNING user_id`,
  );
  return (result.rows ?? []).length === 1;
}

// A send that failed gives its reservation back so it can be retried later.
export async function releaseRecipient(campaign: string, userId: number): Promise<void> {
  await db.execute(sql`DELETE FROM app_launch_email_log WHERE campaign = ${campaign} AND user_id = ${userId}`);
}
