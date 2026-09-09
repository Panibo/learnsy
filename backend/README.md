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

The frontend is hosted at https://panibo.github.io/learnsy/ and the API at
https://backend-faithful-surf-4742.fly.dev. Production frontend builds use these
defaults; development continues to use the local API on port 4000. The Pages
workflow automatically uses the repository base path and the Fly.io API address.
`NEXT_PUBLIC_API_URL` is an optional repository variable override. Set it only
when targeting a different backend; a previously configured value takes precedence.

`fly.toml` makes the API listen on `0.0.0.0:3000`, matching Fly's `internal_port`,
and permits the frontend origin `https://panibo.github.io`. CORS origins do not
include the `/learnsy` path. The Docker image excludes local environment files;
configure the database connection as a Fly secret before deploying:

```sh
cd backend
fly secrets set DB_URL='<MongoDB connection string>' --app backend-faithful-surf-4742
fly deploy
```

The database name defaults to `aisprint`; set `MONGODB_DB` on Fly if a different
database is intended. MongoDB credentials stay on the backend. Fly deploys the API;
pushing frontend changes to `master` or running the Pages workflow deploys the
frontend separately. A successful `OPTIONS /api/profile` request with
`Origin: https://panibo.github.io` returns 204 and the matching CORS header.

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
