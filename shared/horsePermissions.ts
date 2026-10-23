// Account roles do not restrict saving or contacting somebody else's horse.
export function ownsHorse(userId: number | null | undefined, horse: { owner_id: number }) {
  return userId != null && userId === horse.owner_id;
}
