import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Db } from "mongodb";
import { InputError, MAX_CV_BYTES, parseProfile, profiles, saveProfile, serializeProfile } from "./models/profile.js";

import { loadLearner } from "./courses/learner.js";
import { mitCourseSource } from "./courses/mit.js";
import type { RecommendationSource } from "./courses/types.js";

const MAX_BODY_BYTES = Math.ceil(MAX_CV_BYTES / 3) * 4 + 64 * 1024;

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(body));
}

async function body(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new InputError("Request is too large. CV files must be no larger than 5 MB.");
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new InputError("Request must contain valid JSON."); }
}

export function createApiServer(db: Db | undefined, allowedOrigins: string[], courseSource: RecommendationSource = mitCourseSource) {
  return createServer({ requestTimeout: 30_000, headersTimeout: 15_000 }, async (request, response) => {
    try {
      const origin = request.headers.origin;
      response.setHeader("Vary", "Origin, Authorization");
      if (origin && !allowedOrigins.includes(origin)) { json(response, 403, { error: "Origin is not allowed." }); return; }
      if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
      const url = new URL(request.url ?? "/", "http://localhost");
      const courseRoute = url.pathname === "/api/courses/for-you";
      if (url.pathname !== "/api/profile" && !courseRoute) { json(response, 404, { error: "Not found." }); return; }
      if (request.method === "OPTIONS") {
        response.writeHead(204, { "Access-Control-Allow-Methods": courseRoute ? "GET, OPTIONS" : "GET, PUT, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600" });
        response.end(); return;
      }
      if (courseRoute) {
        if (request.method !== "GET") { response.setHeader("Allow", "GET, OPTIONS"); json(response, 405, { error: "Method not allowed." }); return; }
        try {
          const authorization = request.headers.authorization;
          const token = authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
          if (authorization !== undefined && !token) { json(response, 401, { error: "A valid profile access key is required." }); return; }
          let learner = null;
          if (token && db) {
            try { learner = await loadLearner(db, createHash("sha256").update(token).digest("hex")); }
            catch { json(response, 503, { error: "Your saved profile could not be loaded. Please try again." }); return; }
          }
          const exclude = url.searchParams.get("exclude")?.slice(0, 128);
          json(response, 200, { recommendation: await courseSource.getForYou(exclude, learner) });
        } catch {
          json(response, 503, { error: "MIT courses are temporarily unavailable. Please try again." });
        }
        return;
      }
      if (request.method !== "GET" && request.method !== "PUT") {
        response.setHeader("Allow", "GET, PUT, OPTIONS"); json(response, 405, { error: "Method not allowed." }); return;
      }
      if (!db) { json(response, 503, { error: "The profile service is temporarily unavailable. Please try again." }); return; }
      const token = request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token) { json(response, 401, { error: "A valid profile access key is required." }); return; }
      const keyHash = createHash("sha256").update(token).digest("hex");
      if (request.method === "GET") {
        const profile = await profiles(db).findOne({ _id: keyHash });
        if (!profile) { json(response, 404, { error: "Profile not found." }); return; }
        json(response, 200, serializeProfile(profile)); return;
      }
      if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") { json(response, 415, { error: "Use application/json." }); return; }
      const profile = parseProfile(await body(request));
      await saveProfile(db, keyHash, profile);
      json(response, 200, { saved: true });
    } catch (error) {
      if (!response.headersSent && !response.destroyed) json(response, error instanceof InputError ? 400 : 503, { error: error instanceof InputError ? error.message : "The profile service is temporarily unavailable. Please try again." });
    }
  });
}
