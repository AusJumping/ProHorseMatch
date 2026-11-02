// A horse's price range is private: sellers enter it so buyers can filter, and only the owner
// (and the administrator) should ever see the numbers. The screens already hide it, but the
// raw data sent to every browser used to include it. Everything that sends horse records to
// the public or to buyers must pass them through hideHorsePrivate().
import { verifyAuthToken } from "./authToken";

export const ADMIN_EMAIL = "info@australianjumping.com.au";

type WithOwner = { owner_id: number };

// Who is asking? Works for a request with or without a login; never throws.
export function viewerIdFromRequest(req: { headers?: Record<string, any>; session?: { userId?: number } }): number | null {
  try {
    const header = String(req.headers?.authorization ?? "").replace(/^Bearer\s+/i, "");
    const cookie = /(?:^|;\s*)auth_token=([^;]+)/.exec(String(req.headers?.cookie ?? ""))?.[1];
    const token = header || (cookie ? decodeURIComponent(cookie) : "");
    if (token) return verifyAuthToken(token);
    return req.session?.userId ?? null;
  } catch {
    return null;
  }
}

export function hideHorsePrivate<T extends WithOwner>(horse: T, viewerId: number | null, viewerIsAdmin: boolean): T {
  if (viewerIsAdmin || (viewerId !== null && horse.owner_id === viewerId)) return horse;
  const { price_min, price_max, ...rest } = horse as T & { price_min?: unknown; price_max?: unknown };
  return rest as unknown as T;
}

type UserLookup = { getUserById(id: number): Promise<{ email: string } | undefined> };

// Returns a function that hides private fields for this particular request's viewer.
export async function horsePrivacyFor(users: UserLookup, viewerId: number | null) {
  let isAdmin = false;
  if (viewerId !== null) {
    try {
      isAdmin = (await users.getUserById(viewerId))?.email === ADMIN_EMAIL;
    } catch {
      isAdmin = false;
    }
  }
  return <T extends WithOwner>(horse: T): T => hideHorsePrivate(horse, viewerId, isAdmin);
}
