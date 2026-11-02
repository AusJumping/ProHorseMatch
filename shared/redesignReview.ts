export function isRedesignReviewHost(hostname: string): boolean {
  return hostname === "prohorsematch-redesign.onrender.com" ||
    hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname.endsWith(".replit.dev");
}

export function showSampleListingNotice(buildFlag: unknown, hostname: string, status: unknown): boolean {
  if (buildFlag !== "true" || !isRedesignReviewHost(hostname) || !status || typeof status !== "object") return false;
  const flags = status as Record<string, unknown>;
  return flags.environment === "redesign" &&
    ["outboundEmail", "outboundPush", "payments", "mediaUploads"].every(key => flags[key] === false);
}
