import { profileAccessKey } from "../../lib/profile-access";
import { apiBaseUrl } from "../../lib/api";

export type Profile = {
  name: string;
  email: string;
  role: string;
  organization: string;
  companyGoal: string;
  location: string;
  bio: string;
  goals: string;
  linkedin: string;
  interests: string[];
  cv: File | null;
};

export const emptyProfile: Profile = {
  name: "", email: "", role: "", organization: "", location: "",
  bio: "", companyGoal: "", goals: "", linkedin: "", interests: [], cv: null,
};

function encodeFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("The CV could not be read. Please select it again."));
    reader.readAsDataURL(file);
  });
}

export async function profileStore(profile?: Profile): Promise<Profile | undefined> {
  const payload = profile ? {
    ...profile,
    cv: profile.cv ? { name: profile.cv.name, type: profile.cv.type, data: await encodeFile(profile.cv) } : null,
  } : undefined;
  let response: Response;
  const url = `${apiBaseUrl()}/api/profile`;
  const key = profileAccessKey();
  try {
    response = await fetch(url, {
      method: profile ? "PUT" : "GET",
      headers: { Authorization: `Bearer ${key}`, ...(profile ? { "Content-Type": "application/json" } : {}) },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch { throw new Error("Could not reach the profile service. Check your connection and try again."); }
  if (!profile && response.status === 404) return undefined;
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "Your profile could not be saved or loaded. Please try again.");
  }
  if (profile) return profile;
  const saved = await response.json();
  return {
    ...emptyProfile,
    ...saved,
    cv: saved.cv ? new File([Uint8Array.from(atob(saved.cv.data), (character) => character.charCodeAt(0))], saved.cv.name, { type: saved.cv.type }) : null,
  };
}

// Offer the previous browser-only profile as a draft; upload it only when Save is clicked.
export async function loadProfile(): Promise<{ profile?: Profile; needsMigration: boolean }> {
  const saved = await profileStore();
  if (saved) return { profile: saved, needsMigration: false };
  const local = await new Promise<Profile | undefined>((resolve, reject) => {
    const request = indexedDB.open("learnsy-profile", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("profile");
    request.onerror = () => reject(new Error("The previous local profile could not be loaded. Enable browser storage and reload."));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("profile", "readonly");
      const get = transaction.objectStore("profile").get("current");
      transaction.oncomplete = () => { db.close(); resolve(get.result); };
      transaction.onerror = () => { db.close(); reject(new Error("The previous local profile could not be loaded. Please reload.")); };
    };
  });
  return { profile: local ? { ...emptyProfile, ...local } : undefined, needsMigration: Boolean(local) };
}
