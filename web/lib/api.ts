/** Public service address shared by profile and course requests. */
export function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const fallback = process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://backend-faithful-surf-4742.fly.dev";
  return (configured || fallback).replace(/\/+$/, "");
}
