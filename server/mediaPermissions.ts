import { cloudinaryRefFromUrl } from "./cloudinaryRefs";
import { hasRetiredAdminPassword } from "./adminCredentials";

type HorseMedia = { owner_id: number; photos: string[]; videos?: string[] | null };
type MediaStore = {
  getUserById(id: number): Promise<{ email: string; password: string } | undefined>;
  getHorses(): Promise<HorseMedia[]>;
};

export async function mayDeleteImage(
  storage: MediaStore, userId: number, publicId: unknown, cloudName: string | undefined,
): Promise<boolean> {
  // No URLs, traversal, encoded separators or empty path components.
  if (typeof publicId !== "string" || !/^[A-Za-z0-9_/-]+$/.test(publicId) ||
      publicId.split("/").some(part => !part || part === "." || part === "..")) return false;
  const user = await storage.getUserById(userId);
  if (!user) return false;
  if (user.email === "info@australianjumping.com.au") return !await hasRetiredAdminPassword(user.password);
  const uploadOwner = /^horses\/users\/(\d+)\//.exec(publicId);
  if (uploadOwner && Number(uploadOwner[1]) !== userId) return false;
  const horses = await storage.getHorses();
  const linked = horses.filter(horse => horse.photos.some(url => {
    const ref = cloudinaryRefFromUrl(url, cloudName);
    return ref?.resourceType === "image" && ref.publicId === publicId;
  }));
  // A shared reference must not allow an owner to remove someone else's media.
  if (linked.length) return linked.every(horse => horse.owner_id === userId);
  // New uploads carry server-generated ownership even before a listing is saved.
  return publicId.startsWith(`horses/users/${userId}/images/`);
}
