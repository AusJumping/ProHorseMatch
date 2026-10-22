import { pgTable, integer, boolean } from "drizzle-orm/pg-core";
export const redesignSandboxMarker = pgTable("redesign_sandbox_marker", {
  id: integer("id").primaryKey(),
  seeded: boolean("seeded").notNull().default(false),
});
