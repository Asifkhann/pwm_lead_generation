# Lead Generation & Sales Management Dashboard

Internal dashboard for **Perfect Web Metrix** — manage potential small-business clients,
track business information and website problems, log conversations, schedule follow-ups
and follow leads from first contact to conversion.

## Stack

| Layer    | Technology                                                             |
| -------- | ---------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Axios |
| Backend  | Node.js, TypeScript, Express 5                                          |
| Database | MongoDB, Mongoose                                                       |

## Project structure

```
lead-generation-dashboard/
├── client/                 # React + TypeScript + Vite frontend
│   └── src/
│       ├── api/            # Axios instance + typed API calls
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── App.tsx         # Route definitions
│       └── main.tsx        # Providers (Query, Router) + entry point
│
├── server/                 # Express + TypeScript backend
│   └── src/
│       ├── config/         # Environment + database connection
│       ├── controllers/    # Request handlers
│       ├── middleware/     # 404 + centralised error handler
│       ├── routes/         # Route definitions mounted under /api
│       ├── utils/          # ApiError, response helpers
│       ├── app.ts          # Express app factory
│       └── server.ts       # Bootstrap + graceful shutdown
│
└── package.json            # Root scripts to run both apps
```

> **Looking for a command?** `COMMANDS.md` lists every command you need —
> running the app, resetting passwords, MongoDB, backups and troubleshooting.
>
> **Deploying?** `DEPLOYMENT.md` covers Namecheap shared hosting, the
> subdomain, MongoDB Atlas and deploying from the repository.

## Prerequisites

- Node.js 20+
- MongoDB — installed locally, or a MongoDB Atlas connection string

```bash
# macOS local install
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

## Setup

```bash
npm run install:all          # installs client + server dependencies

cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set `MONGODB_URI` in `server/.env`.

## Running in development

```bash
npm run dev                  # runs backend + frontend together
```

Or in separate terminals:

```bash
npm run dev:server           # http://localhost:5050
npm run dev:client           # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, so no CORS setup is needed locally.

## Environment variables

### `server/.env`

| Variable        | Default                                          | Description                            |
| --------------- | ------------------------------------------------ | -------------------------------------- |
| `PORT`          | `5050`                                           | API port (5000 is taken by macOS AirPlay) |
| `NODE_ENV`      | `development`                                    | Environment name                       |
| `CLIENT_ORIGIN` | `http://localhost:5173`                          | Comma-separated allowed CORS origins   |
| `MONGODB_URI`   | `mongodb://127.0.0.1:27017/perfect-web-metrix`   | MongoDB connection string (required)   |
| `JWT_SECRET`    | *(required)*                                     | Signs session tokens — use a long random string in production |
| `SESSION_DAYS`  | `7`                                              | How long a login stays valid           |
| `CLIENT_DIST_PATH` | `../client/dist`                              | Built frontend to serve in production  |

### `client/.env`

| Variable                 | Default                 | Description                                        |
| ------------------------ | ----------------------- | -------------------------------------------------- |
| `VITE_API_BASE_URL`      | *(empty)*               | Leave empty in dev to use the proxy; set in production |
| `VITE_PORT`              | `5173`                  | Vite dev server port                               |
| `VITE_API_PROXY_TARGET`  | `http://localhost:5050` | Backend target for the dev proxy                   |

## API

All responses use a consistent envelope:

```jsonc
// success
{ "success": true, "data": { ... } }

// error
{ "success": false, "message": "…", "details": ... }
```

All endpoints except `/api/health` and `/api/auth/login` require a signed-in
user; the session travels in an httpOnly cookie.

| Method | Endpoint         | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/api/health`    | Service status, uptime and DB connection |
| POST   | `/api/auth/login`  | Sign in, sets the session cookie        |
| POST   | `/api/auth/logout` | Sign out, clears the cookie             |
| GET    | `/api/auth/me`     | Current user and their permissions      |
| POST   | `/api/auth/change-password` | Change your own password (any role) |
| GET    | `/api/settings`    | Workspace settings (public — the sign-in page needs the name) |
| PUT    | `/api/settings`    | Update settings (admin)                 |
| GET    | `/api/users`       | List users (admin)                      |
| POST   | `/api/users`       | Create a user (admin)                   |
| PUT    | `/api/users/:id`   | Update name, email, role, password, active (admin) |
| DELETE | `/api/users/:id`   | Delete a user (admin)                   |
| GET    | `/api/leads`     | Paginated, filterable, sortable list     |
| GET    | `/api/leads/filter-options` | Industries and assignable users for the filter dropdowns |
| GET    | `/api/leads/check-duplicates` | Leads matching a company name, phone or email |
| GET    | `/api/leads/:id` | One lead                                 |
| POST   | `/api/leads`     | Create a lead                            |
| PUT    | `/api/leads/:id` | Update a lead (partial payload allowed)  |
| DELETE | `/api/leads/:id` | Delete a lead (also deletes its communications) |
| GET    | `/api/leads/:id/notes`          | Notes on a lead, newest first |
| POST   | `/api/leads/:id/notes`          | Add a note |
| PUT    | `/api/notes/:id`                | Edit a note (author, or admin) |
| DELETE | `/api/notes/:id`                | Delete a note (author, or admin) |
| GET    | `/api/leads/:id/communications` | Timeline for one lead, newest first |
| POST   | `/api/leads/:id/communications` | Record a call, message or meeting |
| PUT    | `/api/communications/:id`       | Update a communication |
| DELETE | `/api/communications/:id`       | Delete a communication |
| GET    | `/api/follow-ups`               | Pending follow-ups grouped into overdue / today / upcoming |
| GET    | `/api/leads/:id/follow-ups`     | One lead's follow-ups, pending and completed |
| POST   | `/api/leads/:id/follow-ups`     | Schedule a follow-up |
| PUT    | `/api/follow-ups/:id`           | Reschedule or edit the note |
| POST   | `/api/follow-ups/:id/complete`  | Mark complete |
| POST   | `/api/follow-ups/:id/reopen`    | Undo a completion |
| DELETE | `/api/follow-ups/:id`           | Delete a follow-up |
| GET    | `/api/dashboard`                | All dashboard counts and the 14-day trend in one call |
| GET    | `/api/activity?from=&to=`       | Activity totals and a per-day breakdown for a date range |
| GET    | `/api/reports?from=&to=`        | All report datasets for a date range |

### `GET /api/leads` query parameters

| Parameter         | Default     | Notes                                                                     |
| ----------------- | ----------- | ------------------------------------------------------------------------- |
| `page`            | `1`         |                                                                           |
| `limit`           | `20`        | Clamped to 100                                                            |
| `search`          | —           | Case-insensitive partial match on company, contact, owner, email, phone, city |
| `status`          | —           | `new` `contacted` `interested` `follow_up` `proposal` `won` `lost`        |
| `priority`        | —           | `low` `medium` `high`                                                     |
| `industry`        | —           | Exact match                                                               |
| `leadSource`      | —           | `google_maps` `google_search` `facebook` `instagram` `linkedin` `referral` `cold_call` `walk_in` `website` `other` |
| `assignedManager` | —           | Exact match                                                               |
| `sortBy`          | `createdAt` | `createdAt` `updatedAt` `companyName` `status` `priority` `lastContactedAt` `nextFollowUpAt` |
| `sortOrder`       | `desc`      | `asc` or `desc`                                                           |

Unrecognised filter and sort values are ignored rather than rejected.
The list response is `{ items, pagination: { page, limit, total, totalPages } }`.

`status` and `priority` sort by workflow order and urgency rather than
alphabetically, and leads with an empty date always sort to the end.

### Communications

A communication stores date and time as a single `occurredAt` instant, plus
`type` (phone, whatsapp, email, meeting, other), `outcome`, contact person,
discussion notes, client requirements, client concerns, services discussed,
next action and an optional follow-up date.

Recording or changing a communication keeps the lead in step: the lead's
`lastContactedAt` is set from its most recent communication, and a
`followUpDate` creates a follow-up record linked back to that conversation.

### Follow-ups

Follow-ups are their own collection so completions can be counted later. Each
has a lead, due date, note, status (`pending`, `completed`, `cancelled`) and an
optional link to the communication it was agreed on.

A lead's `nextFollowUpAt` is **derived**: it always mirrors that lead's earliest
pending follow-up and is re-synced whenever one is created, rescheduled,
completed or deleted. Nothing else should write to it.

`npm --prefix server run backfill:follow-ups` creates follow-up records for
leads that were given a date before this collection existed. It is safe to
re-run.

### Dashboard

`GET /api/dashboard` answers the whole page in one round trip: lead counts by
status, follow-up counts (overdue / today / upcoming), today's activity,
this month's totals, conversion rate and a 14-day trend.

### Notes

Notes are their own records rather than one text field on the lead, so each has
an author, a timestamp, and can be edited or deleted on its own. You may change
notes you wrote; the `notes:moderate` permission (admin) allows changing
anyone's.

The leads list carries each lead's newest note as `latestNote`, fetched in the
same aggregation, so the expandable row shows it without a request per lead.

`npm --prefix server run migrate:notes` moves text from the old single field
into note records. It writes the note before clearing the old value and is safe
to re-run.

### Managers and authorship

A lead's `assignedTo` points at a user account, not a name typed by hand, so
"Zohaib" and "zohaib" can no longer drift apart. `legacyAssignedManager` keeps
the original text purely so the migration can be re-run.

Communications record `createdBy`, and follow-ups record `createdBy` and
`completedBy`. Manager performance counts calls and follow-ups by who actually
did them rather than inferring it from the lead. Records created before this
existed have no author and appear under "Not attributed".

### Workspace settings

One settings document holds values that used to be hardcoded:

| Setting | Replaces | Effect |
| ------- | -------- | ------ |
| `organisationName` | "Perfect Web Metrix" in three files | Sidebar, sign-in page and footer, including the initials badge |
| `defaultCurrency` | `DEFAULT_CURRENCY` constant | Currency for a new lead when its country suggests none |
| `upcomingFollowUpDays` | `30` in the follow-up controller | How far ahead the Follow-ups page looks |
| `leadsPerPage` | `20` in `useLeadListParams` | Rows on the leads list |

`GET /api/settings` is deliberately public so the sign-in page can show the
right organisation name before anyone signs in; it exposes nothing sensitive.
Writing requires the `settings:manage` permission, so managers see the page
read-only.

### Deal value and currency

A lead carries `dealValue` (null until known) and a `currency` from
`GBP, USD, EUR, PKR`. Typing a country in the form suggests its currency;
picking one by hand always wins over the suggestion.

**Currencies are never added together.** The dashboard and reports show one
figure per currency ("PKR 1,500,000 · £3,000") rather than inventing an
exchange rate. The one place this shows through is sorting by deal value,
which compares the raw numbers, so a PKR lead outranks a GBP one of greater
real worth. Adding a base currency with maintained rates would fix that, and
is the point at which converted totals become possible.

### Duplicate leads

`GET /api/leads/check-duplicates` matches on company name and email
case-insensitively, and on the **last 9 digits** of a phone number ignoring
separators — so `+92 311 5687865`, `0311-5687865` and `(311) 5687865` are all
treated as the same number. It is advisory: the add/edit form shows a warning
with links to the existing leads but never blocks saving, because branches of
one business are legitimate.

### Status history

Each lead carries a `statusTimestamps` subdocument recording when it last
entered each status. Earlier stamps are kept, so the activity and reporting
views can ask "how many leads reached this stage during this period?" rather
than relying on `updatedAt`, which changes on any edit.

`npm --prefix server run backfill:status-timestamps` fills this in for older
leads (from `createdAt` and `updatedAt`, plus the retired `wonAt`/`lostAt`
fields) and is safe to re-run.

### Activity

`GET /api/activity` takes `from` and `to` (ISO, `to` exclusive; 366 days max)
and returns totals plus a per-day breakdown. Ranges longer than 92 days return
`daily: null` rather than an unreadable list. Days are bucketed in local time.

### Reports

`GET /api/reports` takes the same `from`/`to` (1096 days max) and returns every
report dataset in one call: leads over time, breakdowns by industry, source and
status, won/lost with conversion rate, follow-up completion, and per-manager
performance.

Everything is scoped to the selected period, so the numbers always agree:
lead breakdowns count leads *created* in the range, won/lost read
`statusTimestamps`, follow-up completion covers follow-ups *due* in the range,
and manager rows join communications and follow-ups through their lead. The
timeline buckets by day up to 92 days and by month beyond that.

## Authentication & roles

Sessions are JWTs in an httpOnly cookie, so page scripts can never read the
token. Passwords are hashed with scrypt from Node's `crypto` — no native
password dependency.

Access is checked by **permission**, not by role name, so adding a role means
adding one entry to `ROLE_PERMISSIONS` in `server/src/constants/role.ts` (and
its mirror in `client/src/constants/role.ts`) and nothing else.

| Permission | Admin | Senior Manager |
| ---------- | :---: | :------------: |
| `leads:read` / `leads:write` | ✓ | ✓ |
| `communications:write` | ✓ | ✓ |
| `followups:write` | ✓ | ✓ |
| `reports:read` | ✓ | ✓ |
| `leads:delete` | ✓ | — |
| `users:manage` | ✓ | — |
| `settings:manage` | ✓ | — |

Changing a password **signs out that account's other sessions** (the token's
issue time is checked against the user's `sessionsValidFrom`), so an admin
resetting a compromised account actually locks the intruder out. The person
changing their own password keeps their session.

Sign-in is throttled to 20 attempts per 15 minutes per IP, in memory. Behind
more than one server instance, move that to a shared store.

### Forgotten passwords

An admin can reset anyone's password from **Users → Edit**. Nobody is locked out
permanently, because the password can always be reset from the terminal by
someone with server and database access:

```bash
npm --prefix server run reset:password -- admin@example.com anewpassword
```

That leaves the account's role untouched. There is no self-service "forgot my
password" email flow — adding one needs an email provider.

### Creating the first account

```bash
npm --prefix server run create:admin -- "Your Name" you@example.com yourpassword
```

Run with no arguments for a development default
(`admin@perfectwebmetrix.com` / `changeme123`). If the email already exists the
account is promoted to admin and its password reset, so it doubles as a
recovery tool.

## Tests

```bash
npm test              # backend integration tests, then frontend logic tests
npm run test:server
npm run test:client
```

Both use Node's built-in test runner, so no test framework was added.

The backend tests boot the real Express app against a **separate database**
(`perfect-web-metrix-test`) and drive it over HTTP, so routes, permissions,
validation and the Mongoose layer are all exercised together. The harness
refuses to run unless the database name contains "test".

The frontend tests cover the pure logic — date handling, currency formatting,
URL shortening and form validation. Component rendering is not covered; that
would need a DOM environment and test-library dependencies.

## Maintenance scripts

| Command | What it does |
| ------- | ------------ |
| `npm --prefix server run create:admin -- "Name" email password` | Create an admin, or promote an existing account to admin and set its password |
| `npm --prefix server run reset:password -- email password` | Reset any account's password, leaving their role alone |
| `npm --prefix server run sync:indexes` | Apply the models' indexes and drop any that are no longer declared |
| `npm --prefix server run backfill:follow-ups` | Create follow-up records for leads that predate the collection |
| `npm --prefix server run backfill:status-timestamps` | Fill in status history for older leads |

All are safe to re-run.

## Build

```bash
npm run build                # compiles server to dist/ and builds client bundle
npm run build:deploy         # the same, used by the deployment workflow
```

In production one process serves both halves: Express serves the API under
`/api` and the built frontend for everything else, with any unknown path
falling through to `index.html` so browser routing works. Hashed assets are
cached for a year; `index.html` never is, so a deploy is picked up immediately.

Point `CLIENT_DIST_PATH` at the built frontend (it defaults to
`../client/dist`, which is right for a local build).
