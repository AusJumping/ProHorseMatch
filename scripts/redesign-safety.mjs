export const blockedServiceKey = /^(RESEND_|SENDGRID_|VAPID_|FIREBASE_|GOOGLE_APPLICATION_CREDENTIALS$|STRIPE_|VITE_STRIPE_|CLOUDINARY_|CLOUDINARY_URL$)/;

export function validateRedesignDatabase(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Set REDESIGN_DATABASE_URL to the NEW test database connection string."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      decodeURIComponent(url.pathname) !== "/prohorsematch_redesign" ||
      !url.hostname.endsWith(".neon.tech")) {
    throw new Error("Redesign requires a separate Neon database named prohorsematch_redesign.");
  }
  return value;
}

export function redesignEnvironment(source) {
  const database = validateRedesignDatabase(source.REDESIGN_DATABASE_URL);
  if (source.RENDER_GIT_BRANCH && source.RENDER_GIT_BRANCH !== "redesign") {
    throw new Error("The redesign service must deploy the redesign branch, never main.");
  }
  if (!source.SESSION_SECRET || source.SESSION_SECRET.length < 32) {
    throw new Error("Set a NEW SESSION_SECRET of at least 32 characters for the test service.");
  }
  if (!source.REDESIGN_DEMO_PASSWORD || source.REDESIGN_DEMO_PASSWORD.length < 16) {
    throw new Error("Set a NEW REDESIGN_DEMO_PASSWORD of at least 16 characters.");
  }
  const env = { ...source };
  // Do not allow inherited production service credentials into the child app,
  // even if someone accidentally attaches a shared Render environment group.
  for (const key of Object.keys(env)) {
    if (blockedServiceKey.test(key) || key === "NEON_DATABASE_URL") delete env[key];
  }
  env.DATABASE_URL = database;
  env.REDESIGN_SANDBOX = "true";
  return env;
}

export function assertServerEnvironment(env) {
  if (env.RENDER_GIT_BRANCH === "redesign" && env.REDESIGN_SANDBOX !== "true") {
    throw new Error("Use npm run redesign:start for the redesign Render service.");
  }
  if (env.REDESIGN_SANDBOX === "true") {
    validateRedesignDatabase(env.DATABASE_URL);
    if (env.DATABASE_URL !== env.REDESIGN_DATABASE_URL ||
        Object.keys(env).some(key => blockedServiceKey.test(key) && env[key])) {
      throw new Error("Unsafe redesign environment. Start through the redesign launcher.");
    }
  }
}
