export type CloudinaryRef = { publicId: string; resourceType: "image" | "video" };

// Turns a Cloudinary delivery URL into the id and type needed to delete the file.
// Returns null for anything that isn't clearly one of our own uploads, so cleanup
// can never touch media from another account or an external image host.
export function cloudinaryRefFromUrl(url: unknown, cloudName: string | undefined): CloudinaryRef | null {
  if (typeof url !== "string" || !cloudName) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "res.cloudinary.com") return null;

  // /<cloud>/<image|video>/upload/[transformations/]v<version>/<public_id>.<ext>
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 5 || parts[0] !== cloudName || parts[2] !== "upload") return null;

  const resourceType = parts[1];
  if (resourceType !== "image" && resourceType !== "video") return null;

  // Without a version segment we can't tell transformations from folders, so don't guess.
  const versionIndex = parts.findIndex((part, i) => i >= 3 && /^v\d+$/.test(part));
  if (versionIndex === -1 || versionIndex === parts.length - 1) return null;

  let publicId: string;
  try {
    publicId = decodeURIComponent(parts.slice(versionIndex + 1).join("/"));
  } catch {
    return null;
  }
  publicId = publicId.replace(/\.[A-Za-z0-9]+$/, "");
  if (!publicId || publicId.includes("..")) return null;

  return { publicId, resourceType };
}
