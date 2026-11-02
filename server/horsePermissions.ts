import { ownsHorse } from "../shared/horsePermissions";

interface PermissionStorage {
  getHorseById(id: number): Promise<{ owner_id: number } | undefined>;
  getUserById(id: number): Promise<unknown>;
  isBlocked(userA: number, userB: number): Promise<boolean>;
}

export class HorsePermissionError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Accept numeric IDs and their JSON string equivalents, not parseInt prefixes,
// fractions, zero, arrays or coercible objects.
export function positiveId(value: unknown): number {
  if (typeof value !== "number" && !(typeof value === "string" && /^[1-9]\d*$/.test(value))) {
    throw new HorsePermissionError(400, "Invalid participant or horse ID");
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HorsePermissionError(400, "Invalid participant or horse ID");
  }
  return id;
}

export async function checkFavourite(
  storage: PermissionStorage, userId: number, horseId: number, isLiked: boolean,
) {
  // Older self-favourites can still be removed; never reassign their identity.
  if (!isLiked) return;
  const horse = await storage.getHorseById(horseId);
  if (!horse) throw new HorsePermissionError(404, "Horse not found");
  if (ownsHorse(userId, horse)) {
    throw new HorsePermissionError(403, "Cannot save your own horse");
  }
}

export async function checkConversation(
  storage: PermissionStorage, userId: number,
  input: { customer_id?: unknown; owner_id?: unknown; horse_id?: unknown },
) {
  const customer_id = positiveId(input.customer_id);
  const owner_id = positiveId(input.owner_id);
  const horse_id = positiveId(input.horse_id);
  if (userId !== customer_id && userId !== owner_id) {
    throw new HorsePermissionError(403, "Access denied to this conversation");
  }
  if (customer_id === owner_id) {
    throw new HorsePermissionError(403, "Cannot contact yourself");
  }
  const horse = await storage.getHorseById(horse_id);
  if (!horse) throw new HorsePermissionError(404, "Horse not found");
  if (horse.owner_id !== owner_id) {
    throw new HorsePermissionError(403, "Seller does not own this horse");
  }
  if (!(await storage.getUserById(customer_id)) || !(await storage.getUserById(owner_id))) {
    throw new HorsePermissionError(404, "Conversation participant not found");
  }
  if (await storage.isBlocked(customer_id, owner_id)) {
    throw new HorsePermissionError(403, "Unable to send message");
  }
  return { customer_id, owner_id, horse_id };
}
