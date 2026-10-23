const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function isRecentlyAdded(createdAt: Date | string | null | undefined, now = Date.now()): boolean {
  if (!createdAt) return false;
  const timestamp = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= SEVEN_DAYS;
}

export function formatHorseAge(age: number | null | undefined): string {
  if (age === null || age === undefined || !Number.isFinite(age)) return "Age unlisted";
  return age === 1 ? "1 year" : `${age} years`;
}

export function formatHorseHeight(height: number | string | null | undefined): string {
  if (height === "young_horse") return "Young horse";
  if (height === null || height === undefined || height === "") return "Height unlisted";
  return `${height}hh`;
}

const AUSTRALIAN_STATES: Record<string, string> = {
  NSW: "NSW",
  "NEW SOUTH WALES": "NSW",
  VIC: "VIC",
  VICTORIA: "VIC",
  QLD: "QLD",
  QUEENSLAND: "QLD",
  SA: "SA",
  "SOUTH AUSTRALIA": "SA",
  WA: "WA",
  "WESTERN AUSTRALIA": "WA",
  TAS: "TAS",
  TASMANIA: "TAS",
  ACT: "ACT",
  "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  NT: "NT",
  "NORTHERN TERRITORY": "NT",
};

function normalizeAustralianState(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return AUSTRALIAN_STATES[value.trim().toUpperCase()] ?? null;
}

export function getAustralianState(
  additionalInfo: string | null | undefined,
  explicitState?: unknown,
): string | null {
  const metadataState = normalizeAustralianState(explicitState);
  if (metadataState) return metadataState;
  if (typeof additionalInfo !== "string" || additionalInfo.length > 2000) return null;

  // Existing listing text uses phrases such as “Based in Bowral, NSW.”
  // Only accept a state following a short, explicitly location-led phrase.
  const match = additionalInfo.match(
    /\b(?:based|located)\s+in\s+[^,.;\n]{1,80},\s*(NSW|VIC|QLD|SA|WA|TAS|ACT|NT|New South Wales|Victoria|Queensland|South Australia|Western Australia|Tasmania|Australian Capital Territory|Northern Territory)\b/i,
  );
  return normalizeAustralianState(match?.[1]);
}
