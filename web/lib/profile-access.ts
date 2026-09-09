const ACCESS_KEY = "learnsy-profile-access-key";

/** Shared by profile editing and recommendations so both use the same owner. */
export function profileAccessKey() {
  let key = localStorage.getItem(ACCESS_KEY);
  if (!key || !/^[a-f0-9]{64}$/.test(key)) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(ACCESS_KEY, key);
  }
  return key;
}
