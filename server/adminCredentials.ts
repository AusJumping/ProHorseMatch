import bcrypt from "bcrypt";

// This was a public, source-controlled seed password, not a deployment secret.
// Keep it only as a deny rule, including for accounts already created by old code.
const retiredSeedPassword = "AdminPro2025!";

export async function hasRetiredAdminPassword(password: unknown): Promise<boolean> {
  if (typeof password !== "string" || !password) return true;
  if (password === retiredSeedPassword) return true;
  if (/^\$2[aby]\$/.test(password)) return bcrypt.compare(retiredSeedPassword, password);
  return false;
}
