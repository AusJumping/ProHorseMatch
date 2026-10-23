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
