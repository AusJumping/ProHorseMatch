import { spawnSync } from "node:child_process";
import bcrypt from "bcrypt";
import { pool, db } from "../server/db";
import { users, horses } from "../shared/schema";
import { assertServerEnvironment } from "./redesign-safety.mjs";

assertServerEnvironment(process.env);
if (process.env.REDESIGN_SANDBOX !== "true") throw new Error("Sandbox setup only.");

try {
  const marker = await pool.query("SELECT to_regclass('public.redesign_sandbox_marker') AS marker");
  if (!marker.rows[0].marker) {
    const tables = await pool.query(
      "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
    );
    if (tables.rows[0].count !== 0) {
      throw new Error("Refusing to initialise a non-empty, unmarked database. Create a NEW empty Neon database.");
    }
    await pool.query("CREATE TABLE redesign_sandbox_marker (id integer PRIMARY KEY CHECK (id=1), seeded boolean NOT NULL DEFAULT false)");
    await pool.query("INSERT INTO redesign_sandbox_marker (id) VALUES (1)");
  }
  const marked = await pool.query("SELECT seeded FROM redesign_sandbox_marker WHERE id=1");
  if (marked.rows.length !== 1) throw new Error("Invalid sandbox database marker.");

  // This config includes the marker so subsequent schema pushes preserve it.
  const migration = spawnSync("node", [
    "node_modules/drizzle-kit/bin.cjs", "push", "--config=drizzle.redesign.config.ts", "--force",
  ], { env: process.env, stdio: "inherit" });
  if (migration.status !== 0) throw new Error("Test database schema setup failed.");

  if (!marked.rows[0].seeded) {
    const password = await bcrypt.hash(process.env.REDESIGN_DEMO_PASSWORD!, 12);
    await db.transaction(async tx => {
      const [seller] = await tx.insert(users).values({
        email: "seller@redesign.invalid", username: "DemoSeller", password,
        name: "Fictional Demo Seller", business_name: "Demo Stables — Not Real Listings",
        is_searching: true, is_selling: true, email_verified: true,
        subscription_status: "active", subscription_plan: "beta",
        subscription_tier: "beta_free", stripe_subscription_id: "beta",
        accepted_terms: true, accepted_terms_at: new Date(), accepted_terms_version: "1.0",
      }).returning({ id: users.id });
      await tx.insert(users).values({
        email: "buyer@redesign.invalid", username: "DemoBuyer", password,
        name: "Fictional Demo Buyer", is_searching: true, is_selling: false,
        email_verified: true, subscription_status: "active", subscription_plan: "beta",
        subscription_tier: "beta_free", stripe_subscription_id: "beta",
        accepted_terms: true, accepted_terms_at: new Date(), accepted_terms_version: "1.0",
      });
      const examples = [
        { name: "Demo — Amber", discipline: "Jumping", level: "1.20m", age: 8, price: 25000, sex: "Mare", colour: "Bay" },
        { name: "Demo — Orion", discipline: "Dressage", level: "Medium", age: 10, price: 35000, sex: "Gelding", colour: "Black" },
        { name: "Demo — Willow", discipline: "Eventing", level: "CCI1*", age: 6, price: 18000, sex: "Mare", colour: "Chestnut" },
      ];
      await tx.insert(horses).values(examples.map(horse => ({
        owner_id: seller.id, name: horse.name, location_country: "Australia",
        disciplines: [horse.discipline], levels: [horse.level], breeds: ["Warmblood"],
        age: horse.age, height_hands: 16.1, height_cm: 165,
        sex: horse.sex, colour: horse.colour, price_min: horse.price,
        price_max: horse.price + 5000, currency: "AUD",
        description: "FICTIONAL SAMPLE — For redesign testing only. This horse is not for sale.",
        photos: ["/icons/icon-512.png"], videos: [],
      })));
      // Keep the seed and its marker atomic; restarts never overwrite test edits.
      const { sql } = await import("drizzle-orm");
      await tx.execute(sql`UPDATE redesign_sandbox_marker SET seeded=true WHERE id=1`);
    });
    console.log("Created 3 fictional horses and demo buyer/seller accounts. No emails sent.");
  } else {
    console.log("Existing redesign sample data preserved.");
  }
} finally {
  await pool.end();
}
