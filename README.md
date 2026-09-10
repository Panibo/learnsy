# Learnsy

Find your next sustainability course, understand why it matters to your work, and turn one idea into action.

Built for the **Learnsy challenge** at [AI Solution Sprint](https://maria.io/events/ai-solution-sprint/), held at Maria 01 in Helsinki on **9–10 September 2026**, hosted by Business Helsinki, Metropolia, Haaga-Helia and AI Start. This repository presents a working sprint prototype of a personalized learning experience.

**[Open Learnsy](https://panibo.github.io/learnsy/)**

## The challenge

The Learnsy challenge is to make sustainability learning something employees are curious to follow and apply in their everyday work. There is plenty of learning content available; the difficult part is connecting it to the right person's role, interests, existing knowledge and their company's sustainability priorities.

Our approach focuses on the next learning decision: show one course, explain its relevance, make the personal benefits easy to scan, and suggest a small action to try at work.

## The experience

- **For you:** the landing page presents one sustainability course, with its overview, study details, available materials and a link to the original course.
- **Why this is for you:** an AI advisor concept connects the course to the learner's professional context, interpreting the saved profile without repeating their goals as a separate banner.
- **What you'll gain:** three short takeaways help the learner decide whether the course feels useful.
- **Try this at work:** a ten-minute activity connects learning to a practical question for a team conversation or supplier review.
- **Professional profile:** save basic information, role, organization, interests, learning goals, company sustainability priorities, a LinkedIn link and a CV in MongoDB. CV uploads support PDF, DOC and DOCX files up to 5 MB.
- **Show another course:** explore an alternative without browsing a large catalogue.

To explore the concept, open **For you**, create and save a **Profile**, then return to see how the advisor's explanation responds to that context.

## What works today

| Part | Current implementation |
| --- | --- |
| Course catalogue | Real MIT OpenCourseWare metadata fetched through the public [MIT Learn API](https://api.learn.mit.edu/api/v1/courses/?platform=ocw&topic=Energy%2C%20Climate%20%26%20Sustainability), filtered to **Energy, Climate & Sustainability**. |
| Course selection | Opens with **Green Supply Chain Management** when available. Alternatives are randomly selected from a shortlist of business, supply-chain and energy courses, falling back to the fetched catalogue. |
| Advisor and benefits | Mock copy generated with keyword rules and templates. Saved profile context influences the explanation and workplace action; the three takeaways depend on the course. No AI model is called. |
| Profile storage | Profiles and CV bytes persist in MongoDB. LinkedIn links and CVs are stored but are not analyzed. |

The profile does not yet determine which course is selected. The intended production flow would use the profile and course content to rank courses, then generate explanations and benefits grounded in the selected course. Learning history and adaptive journeys are future work.

## Architecture

The **Next.js 16 / React 19 / TypeScript** frontend is exported as a static site. It calls a separate **Node.js / TypeScript HTTP API**, which stores profiles in **MongoDB** and retrieves course metadata from MIT Learn. Course requests run when the page loads, not during the frontend build.

| Location | Purpose |
| --- | --- |
| [`web/app/`](web/app/) | For-you landing page, profile editor and shared UI. |
| [`web/lib/`](web/lib/) | API client, browser profile access key and shared course types. |
| [`backend/src/`](backend/src/) | HTTP routes, MongoDB persistence and course discovery. |
| [`backend/src/courses/`](backend/src/courses/) | MIT integration, normalized course contract, selection and advisor logic. |
| [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) | Frontend build and GitHub Pages deployment. |

Course provider metadata is kept separate from recommendation copy, leaving room for additional providers and a future AI recommendation pipeline. The MIT catalogue is cached in each running backend's memory for six hours; a failed refresh can reuse cached data up to 24 hours old.

Profile access uses a random key stored in the browser's local storage, with only its hash stored in the database. There is no account sign-in or cross-device recovery yet: clearing browser storage loses access to that profile. Email, LinkedIn and CV data are excluded from the advisor's profile query, and no profile data is sent to MIT.

## Run locally

You need **Node.js 24**, npm, and a local MongoDB server or MongoDB Atlas database. Run these commands from the repository root:

```sh
npm --prefix backend ci
npm --prefix web ci
cp backend/.env.example backend/.env
```

Edit `backend/.env` and replace `DB_URL` with your MongoDB connection string. For a local MongoDB server:

```dotenv
DB_URL=mongodb://127.0.0.1:27017
MONGODB_DB=aisprint
HOST=127.0.0.1
PORT=4000
WEB_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

For Atlas, use your database credentials and allow the backend's outbound IP address in the database's network access list.

Start the API in one terminal:

```sh
npm --prefix backend run dev
```

Start the frontend in another:

```sh
npm --prefix web run dev
```

Open [localhost:3000](http://localhost:3000). The frontend uses the API at `http://localhost:4000` automatically. No MIT or AI API key is required.

To use a different API, set `NEXT_PUBLIC_API_URL` in `web/.env.local`; see [`web/.env.example`](web/.env.example). This public value is embedded at build time. Keep database credentials in the backend environment.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/profile` | Load the current browser's profile; requires its bearer access key. |
| `PUT` | `/api/profile` | Create or update the profile and CV; requires the same key. |
| `GET` | `/api/courses/for-you` | Get a course, explanation, three benefits and workplace action. An optional bearer key supplies profile context; `?exclude=<course-id>` requests an alternative. |

A profile `404` means that browser has no saved profile yet. A `503` indicates a required dependency is unavailable. See the [backend documentation](backend/README.md) for response details and the [course integration notes](web/lib/courses/README.md) for provider and personalization behavior.

## Checks

```sh
npm --prefix backend test
npm --prefix web run lint
npm --prefix web run build
```

Backend tests cover profile validation, HTTP behavior, course discovery, caching and selection using stubbed MIT responses. When `DB_URL` is configured, profile persistence tests create and drop an isolated temporary database; the database user needs those permissions. That integration test is skipped without `DB_URL`.

## Deployment

- **Frontend:** [GitHub Pages](https://panibo.github.io/learnsy/). The workflow deploys changes under `web/` or the workflow file when pushed to `master`, and also supports manual runs. It publishes `web/out` using the `/learnsy` base path. The optional repository variable `NEXT_PUBLIC_API_URL` overrides the default Fly.io API address.
- **Backend:** [Fly.io](https://backend-faithful-surf-4742.fly.dev), configured in [`backend/fly.toml`](backend/fly.toml). Set `DB_URL` as a Fly secret, then run `fly deploy` from `backend/`. See [backend deployment instructions](backend/README.md#deployment).
- **Database:** MongoDB must allow the outbound IP addresses of the Fly machines. CORS uses the frontend origin `https://panibo.github.io`, without the `/learnsy` path.

The current Fly configuration stops idle machines, so the first request after inactivity may take longer. Restarting also clears the in-memory course cache. If MongoDB was unavailable during backend startup, fix its connection settings or network access and restart the backend to restore profile persistence.

## Where this could go next

- Select courses using professional context, company priorities and existing knowledge, with AI explanations grounded in course content.
- Add more learning providers, feedback and learning history so recommendations adapt over time.
- Introduce account authentication and a persistent shared course catalogue for a production service.
