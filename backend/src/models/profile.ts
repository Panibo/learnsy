import { Binary, type Db } from "mongodb";

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export class InputError extends Error {}
export type ProfileData = {
  name: string; email: string; role: string; organization: string;
  location: string; bio: string; goals: string; linkedin: string;
  interests: string[];
  cv: { name: string; type: string; data: Binary } | null;
};
export type ProfileDocument = ProfileData & { _id: string; createdAt: Date; updatedAt: Date };

export function parseProfile(input: unknown): ProfileData {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new InputError("A profile object is required.");
  const value = input as Record<string, unknown>;
  function string(key: string, max: number, required = false) {
    const item = value[key];
    if (typeof item !== "string" || item.length > max || (required && !item.trim())) throw new InputError(`Invalid ${key}.`);
    return item.trim();
  }
  const name = string("name", 120, true);
  const email = string("email", 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("Enter a valid email address.");
  const linkedin = string("linkedin", 500);
  if (linkedin) {
    try {
      const url = new URL(linkedin);
      if (url.protocol !== "https:" || !/^(www\.)?linkedin\.com$/.test(url.hostname) || !/^\/in\/[^/]+\/?$/.test(url.pathname) || url.username || url.password) throw new Error();
    } catch { throw new InputError("Enter a valid HTTPS LinkedIn profile URL."); }
  }
  if (!Array.isArray(value.interests) || value.interests.length > 50 || value.interests.some((item) => typeof item !== "string" || !item.trim() || item.length > 80)) throw new InputError("Provide up to 50 interests, each no longer than 80 characters.");
  const interests = [...new Map((value.interests as string[]).map((item) => [item.trim().toLowerCase(), item.trim()])).values()];
  let cv: ProfileData["cv"] = null;
  if (value.cv !== null) {
    if (!value.cv || typeof value.cv !== "object") throw new InputError("Invalid CV.");
    const file = value.cv as Record<string, unknown>;
    if (typeof file.name !== "string" || file.name.length > 255 || /[\\/\x00-\x1f]/.test(file.name) || !/\.(pdf|doc|docx)$/i.test(file.name)) throw new InputError("Choose a PDF, DOC, or DOCX CV.");
    if (typeof file.data !== "string" || !file.data || file.data.length > Math.ceil(MAX_CV_BYTES / 3) * 4 || (file.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data))) throw new InputError("Invalid CV file data.");
    const bytes = Buffer.from(file.data, "base64");
    if (bytes.toString("base64") !== file.data || !bytes.length || bytes.length > MAX_CV_BYTES) throw new InputError("The CV must be no larger than 5 MB.");
    const extension = file.name.split(".").pop()!.toLowerCase();
    const types: Record<string, string> = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    cv = { name: file.name, type: types[extension], data: new Binary(bytes) };
  }
  return { name, email, role: string("role", 160), organization: string("organization", 160), location: string("location", 160), bio: string("bio", 2000), goals: string("goals", 2000), linkedin, interests, cv };
}

export function profiles(db: Db) { return db.collection<ProfileDocument>("profiles"); }

export async function saveProfile(db: Db, keyHash: string, profile: ProfileData) {
  const now = new Date();
  await profiles(db).updateOne({ _id: keyHash }, { $set: { ...profile, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
}

export function serializeProfile(profile: ProfileDocument) {
  const { _id, createdAt, updatedAt, cv, ...fields } = profile;
  return { ...fields, cv: cv ? { name: cv.name, type: cv.type, data: Buffer.from(cv.data.value()).toString("base64") } : null };
}
