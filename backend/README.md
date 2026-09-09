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
The optional `companyGoal` field stores the organization's sustainability priority;
older profiles without it continue to load with an empty value.

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

## MIT sustainability course discovery

`GET /api/courses/for-you` is a read-only endpoint returning
`{ recommendation: { id, selection, course, rationale, gains, learner, workplaceAction, catalog } }`, or
`{ recommendation: null }` when no courses are available. It fetches the official
MIT Learn catalogue with `platform=ocw` and the exact topic
`Energy, Climate & Sustainability`, following all result pages. It needs no MIT key
and does not send profiles or CVs to MIT. The frontend sends the same bearer key
used by `/api/profile`. The backend reads that owner's current name, role,
organization, company goal, learning goals, bio, and interests on each request.
Email, LinkedIn, and CV data are excluded from the database query and response.
An anonymous request or a key without a saved profile returns `learner: null`;
malformed keys return 401 and profile-loading failures return 503.

Pass `?exclude=mit-ocw-<id>` to draw a different course when at least two exist.
The catalogue is cached for six hours and a failed refresh can use cached data up
to 24 hours old; the response marks stale data. Unavailable data returns 503, and
upstream retry attempts back off for 30 seconds. Outbound HTTPS access to
`api.learn.mit.edu` is required. A running backend is required for the static
frontend, using the same `NEXT_PUBLIC_API_URL` and `WEB_ORIGINS` configuration as
profiles. No course API requests are made at frontend build time.

Course tests use stubbed MIT responses to cover normalization, filtering,
pagination, duplicate removal, cache expiry and failures, random selection,
exclusion, and HTTP behavior. The existing profile integration tests still use
an isolated temporary MongoDB database.

The course response includes `learner`, `workplaceAction`, and `rationale` using
the saved profile. Learner context is never stored in the shared course cache.
The page keeps profile fields and goal statements out of the layout. Saved context
is interpreted in the advisor's reasoning, with a link to refine recommendations.

When available, Green Supply Chain Management is the opening course, identified
by `selection: "presentation"`. Alternatives are randomly selected from a shortlist
of suitable live MIT business/supply-chain/energy courses. If none are available,
the fetched catalogue remains the fallback pool. `rationale.mode` is `mock-ai`:
three template explanation points interpret professional context, infer a learning
direction, and connect it to the course. Keyword rules consider goals, interests,
bio, and role without quoting profile fields or goals in the displayed copy.
A ten-minute workplace action provides a supplier-review question for procurement
roles and a team-discussion question for other roles. No model is called, and
course selection does not yet depend on the profile. Production can replace the
selector and template generator with a recommendation pipeline.

`gains` supplies three brief personal takeaways for the card below the advisor.
These are mock course-specific copy (`mode: "mock-ai"`), kept separate from
MIT metadata. Replace `createMockCourseGains` with course-content generation
when integrating the production recommendation pipeline.
