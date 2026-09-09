# For-you course discovery

The static page mounts a client component which calls
`GET /api/courses/for-you` on `NEXT_PUBLIC_API_URL` (localhost:4000 during development).
No provider calls run during the Next.js build. The normalized contract is shared
as a type-only import from `backend/src/courses/types.ts`.

## Saved profile context

The page uses the visitor's MongoDB profile. `web/lib/profile-access.ts` shares the
same browser access key between profile editing and course requests. The backend
reads only the current owner's name, role, organization, company goal, learning
goals, bio, and interests; email, LinkedIn, and CVs are excluded. This context is
loaded on every request and stays outside the shared course catalogue cache.

The page does not show a profile strip, goal statement, bio, or interest tags.
Saved context informs the advisor's explanation in the background. A subtle link
below the explanation leads to `/profile` to refine recommendations or add context.
Database failures show a retryable error. No fictional identity is used as a fallback.

The opening recommendation is the real MIT course **Green Supply Chain Management**
when available. **Show another course** randomly draws from a shortlist of live
business/supply-chain/energy courses, excluding the current course when possible.
If the shortlist is unavailable, the fetched catalogue is the fallback pool.
`selection: "presentation"` identifies the opening selection internally; alternative
random draws use `random`. The visible page omits development labels.

The AI learning advisor's three explanation points interpret professional context,
infer a likely learning direction, and connect it to the course. Keyword-based
templates (`rationale.mode: "mock-ai"`) look at learning goals, company goals,
interests, bio, then role, without repeating saved fields verbatim. No model is
called and the profile does not yet affect course selection. **Try this at work**
offers a supplier question for procurement roles and a team-discussion question
based on the inferred direction for other roles.

**What you’ll gain** sits below the advisor in the right column. The response's
`gains` contains exactly three short titles and descriptions for a quick scan.
`backend/src/courses/gains.ts` selects mock takeaways for the current course,
independent of the private learner context. Keep these separate from provider
metadata; production can replace the generator with one grounded in course
content and switch `gains.mode` from `mock-ai` to `ai`.

The course card combines a compact illustrated header, overview, study facts,
materials, instructors, and course actions. Its two sections share grid rows with
the advisor and gains so the desktop columns align without spreading the overview
paragraphs apart. On narrow screens, the sections stack in reading order. Course
materials appear inside the recommendation instead of in a separate page section.

## Provider integration

The backend retrieves every page from MIT Learn's public course API, restricted
to MIT OpenCourseWare and the exact `Energy, Climate & Sustainability` topic.
It validates published records and MIT course links, then removes duplicate IDs.
Provider metadata is never replaced by invented course content. Missing fields
are omitted or marked unspecified. Materials are accessed on the original course
page; OCW is independent study, not enrollment or certification.

The catalogue is cached in backend memory for six hours. Concurrent fetches are
coalesced; failures back off for 30 seconds and may serve a successful catalogue
up to 24 hours old. The UI notes stale course information. Cold-start failures
return 503 with a retry action; genuinely empty results return null. Requests have
timeouts, a pagination limit, and same-origin pagination validation.

The GitHub Pages build uses the `NEXT_PUBLIC_API_URL` repository variable. Host the
backend separately, permit the frontend's `WEB_ORIGINS`, and allow outbound HTTPS
to api.learn.mit.edu. No MIT API key is needed. No profile details or access keys
are sent to MIT.

## Future personalization

Keep learner context, workplace action, and rationale separate from provider-owned
course data. Replace the presentation selector and copy generator with a pipeline
that uses the authorized profile to select a course and generate grounded reasoning.
Only return `selection: "ai"` and `rationale.mode: "ai"` when that processing runs.
Never read private profiles at build time or put them into exported HTML.

Provider references:
- https://api.learn.mit.edu/api/v1/courses/?platform=ocw&topic=Energy%2C%20Climate%20%26%20Sustainability
- https://github.com/mitodl/ocw_oer_export/blob/main/ocw_oer_export/config.py
- https://github.com/mitodl/mit-learn/blob/main/learning_resources/filters.py
- https://github.com/mitodl/mit-learn/blob/main/main/filters.py
- https://ocw.mit.edu/pages/get-started/
