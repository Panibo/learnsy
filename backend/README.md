# Profile API

The static Next.js frontend calls this Node.js API. MongoDB stores each profile
and its CV bytes atomically in the `profiles` collection. The existing `users`
collection is unchanged. CVs are limited to 5 MB, below MongoDB's document limit.

## Local development

1. Install backend dependencies with `npm install`.
2. Copy `.env.example` to `.env` and configure `DB_URL` and `MONGODB_DB`.
3. Run `npm run dev` (API defaults to `http://localhost:4000`).
4. Run `npm run dev` in `../web`. The development frontend defaults to port 4000
   for the API; override with `NEXT_PUBLIC_API_URL` in `web/.env.local` if needed.

`GET /api/profile` loads a profile; `PUT /api/profile` validates and saves it.
Both require `Authorization: Bearer <64-character random hexadecimal key>`.
A missing profile returns 404. A PUT creates or updates the same profile; sending
`cv: null` removes the previously stored CV. The API never looks up profiles by email.

The browser creates and retains a private 256-bit access key in localStorage.
Only its SHA-256 hash is stored as the document ID. This is anonymous possession-based
access, not account authentication: clearing browser storage loses access, and there
is no cross-device recovery or account linking yet. Do not share the key. Add account
sign-in and ownership checks before extending this into an account-based service.

Previously saved IndexedDB profiles appear as drafts when there is no database
profile. Clicking Save uploads the draft and CV. Existing local data is retained.
Loading failures disable editing to avoid overwriting a profile that failed to load.

## Deployment

GitHub Pages serves only the frontend. Host this backend separately with Node 22+
and MongoDB connectivity; run `npm run build` followed by `npm start`. Configure
`DB_URL`, `MONGODB_DB`, `PORT`, and `HOST` as needed (`0.0.0.0` for containers).
Put the API behind HTTPS and set `WEB_ORIGINS` to the exact frontend origin, for
example `https://example.github.io` (without the repository path).

Set the GitHub repository variable `NEXT_PUBLIC_API_URL` to the backend HTTPS
address before deploying Pages. The workflow embeds this public address at build
time; MongoDB credentials stay exclusively on the backend. No backend is deployed
by the Pages workflow. Production builds without an API address show a configuration
error instead of silently storing data locally.

## Verification

`npm test` runs API integration tests in a temporary, isolated database on the
configured MongoDB server, then drops only that temporary database. Requires a
`DB_URL` with permission to create/drop a test database. `npm run build` checks types.
