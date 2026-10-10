import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";
import { runInNewContext } from "node:vm";

const compiled = buildSync({
  entryPoints: ["server/cloudinaryRefs.ts"],
  bundle: true, write: false, format: "cjs",
}).outputFiles[0].text;

const sandbox = { module: { exports: {} }, URL, decodeURIComponent };
runInNewContext(compiled, sandbox);
const run = sandbox.module.exports.cloudinaryRefFromUrl;
// Objects made inside the vm sandbox have a different prototype, so normalise before deepEqual.
const cloudinaryRefFromUrl = (...args) => { const r = run(...args); return r === null ? null : JSON.parse(JSON.stringify(r)); };

const CLOUD = "dcorxaflu";
const base = `https://res.cloudinary.com/${CLOUD}`;

test("reads an image upload with a folder", () => {
  assert.deepEqual(cloudinaryRefFromUrl(`${base}/image/upload/v1700000000/horses/abc123.jpg`, CLOUD),
    { publicId: "horses/abc123", resourceType: "image" });
});

test("reads a video upload", () => {
  assert.deepEqual(cloudinaryRefFromUrl(`${base}/video/upload/v1700000000/horses/clip.mp4`, CLOUD),
    { publicId: "horses/clip", resourceType: "video" });
});

test("skips transformation segments before the version", () => {
  assert.deepEqual(cloudinaryRefFromUrl(`${base}/image/upload/c_fill,w_800/q_auto/v12/horses/x.webp`, CLOUD),
    { publicId: "horses/x", resourceType: "image" });
});

test("decodes encoded characters in the public id", () => {
  assert.equal(cloudinaryRefFromUrl(`${base}/image/upload/v1/horses/my%20horse.jpg`, CLOUD).publicId, "horses/my horse");
});

test("refuses anything that is not clearly one of our own uploads", () => {
  assert.equal(cloudinaryRefFromUrl(`https://res.cloudinary.com/otherCloud/image/upload/v1/horses/a.jpg`, CLOUD), null);
  assert.equal(cloudinaryRefFromUrl("https://example.com/horses/a.jpg", CLOUD), null);
  assert.equal(cloudinaryRefFromUrl(`${base}/image/upload/horses/a.jpg`, CLOUD), null, "no version segment, so we won't guess");
  assert.equal(cloudinaryRefFromUrl(`${base}/image/upload/v1`, CLOUD), null);
  assert.equal(cloudinaryRefFromUrl(`${base}/image/fetch/v1/horses/a.jpg`, CLOUD), null);
  assert.equal(cloudinaryRefFromUrl(`${base}/raw/upload/v1/horses/a.jpg`, CLOUD), null);
  assert.equal(cloudinaryRefFromUrl(`${base}/image/upload/v1/horses/%2E%2E/%2E%2E/a.jpg`, CLOUD), null, "path traversal");
  assert.equal(cloudinaryRefFromUrl("not a url", CLOUD), null);
  assert.equal(cloudinaryRefFromUrl(undefined, CLOUD), null);
  assert.equal(cloudinaryRefFromUrl(`${base}/image/upload/v1/horses/a.jpg`, undefined), null, "no cloud name configured");
});
