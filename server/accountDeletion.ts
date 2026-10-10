import { eq, inArray, or } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "@shared/schema";
import { cloudinaryRefFromUrl, type CloudinaryRef } from "./cloudinaryRefs";

type Db = PgDatabase<any, any, any>;

// Permanently removes a user and everything that belongs to them, in one transaction
// so a failure part-way through leaves the account untouched.
// Safety reports are kept on purpose: they are moderation records, not the user's content.
export async function deleteAccountData(db: Db, userId: number): Promise<{ mediaUrls: string[] }> {
  return db.transaction(async (tx) => {
    const horseRows = await tx
      .select({ id: schema.horses.id, photos: schema.horses.photos, videos: schema.horses.videos })
      .from(schema.horses)
      .where(eq(schema.horses.owner_id, userId));
    const horseIds = horseRows.map((horse) => horse.id);
    const mediaUrls = horseRows.flatMap((horse) => [...(horse.photos ?? []), ...(horse.videos ?? [])]);

    const searchRows = await tx
      .select({ id: schema.savedSearches.id })
      .from(schema.savedSearches)
      .where(eq(schema.savedSearches.user_id, userId));
    const searchIds = searchRows.map((search) => search.id);

    if (searchIds.length > 0) {
      await tx.delete(schema.searchNotifications).where(inArray(schema.searchNotifications.saved_search_id, searchIds));
    }
    if (horseIds.length > 0) {
      await tx.delete(schema.searchNotifications).where(inArray(schema.searchNotifications.horse_id, horseIds));
      await tx.delete(schema.matches).where(inArray(schema.matches.horse_id, horseIds));
    }

    await tx.delete(schema.matches).where(eq(schema.matches.customer_id, userId));
    await tx.delete(schema.messages).where(or(eq(schema.messages.customer_id, userId), eq(schema.messages.owner_id, userId)));
    await tx.delete(schema.conversations).where(or(eq(schema.conversations.customer_id, userId), eq(schema.conversations.owner_id, userId)));
    await tx.delete(schema.savedSearches).where(eq(schema.savedSearches.user_id, userId));
    await tx.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.user_id, userId));
    await tx.delete(schema.deviceTokens).where(eq(schema.deviceTokens.user_id, userId));
    await tx.delete(schema.loginEvents).where(eq(schema.loginEvents.user_id, userId));
    await tx.delete(schema.horseDeletionResponses).where(eq(schema.horseDeletionResponses.user_id, userId));
    await tx.delete(schema.blockedUsers).where(or(eq(schema.blockedUsers.blocker_id, userId), eq(schema.blockedUsers.blocked_id, userId)));
    await tx.delete(schema.horses).where(eq(schema.horses.owner_id, userId));
    await tx.delete(schema.users).where(eq(schema.users.id, userId));

    return { mediaUrls };
  });
}

// Best-effort: the account is already gone, so a failed file deletion is logged, never thrown.
export async function removeCloudinaryMedia(
  urls: string[],
  cloudName: string | undefined,
  destroy: (ref: CloudinaryRef) => Promise<unknown>,
): Promise<number> {
  const refs = urls
    .map((url) => cloudinaryRefFromUrl(url, cloudName))
    .filter((ref): ref is CloudinaryRef => ref !== null);

  const results = await Promise.allSettled(refs.map((ref) => destroy(ref)));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) console.error(`Account deletion: ${failed} of ${refs.length} media files could not be removed from Cloudinary`);
  return refs.length - failed;
}
