import { defineConfig } from "drizzle-kit";
import { assertServerEnvironment } from "./scripts/redesign-safety.mjs";
assertServerEnvironment(process.env);
if (process.env.REDESIGN_SANDBOX !== "true") throw new Error("Redesign database setup only.");
export default defineConfig({
  schema: ["./shared/schema.ts", "./shared/redesign-marker.ts"],
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
