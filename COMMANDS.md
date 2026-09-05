# Command reference

Every command you need, in one place. Run all of them from the project root
(`/Users/mymac/IRT/sales-dashbaord`) unless a command says otherwise.

- [Everyday use](#everyday-use)
- [Accounts & passwords](#accounts--passwords)
- [MongoDB](#mongodb)
- [Database maintenance](#database-maintenance)
- [Checks before committing](#checks-before-committing)
- [Environment variables](#environment-variables)
- [When something is broken](#when-something-is-broken)
- [Looking at the data directly](#looking-at-the-data-directly)

---

## Everyday use

| What you want | Command |
| ------------- | ------- |
| **Start working** (backend + frontend together) | `npm run dev` |
| Start only the backend | `npm run dev:server` |
| Start only the frontend | `npm run dev:client` |
| Stop everything | `Ctrl + C` in the terminal running it |
| Install dependencies after pulling changes | `npm run install:all` |

Once running:

- App: **http://localhost:5173**
- API: **http://localhost:5050/api**
- Health check: **http://localhost:5050/api/health**

> Port 5050, not 5000 — macOS AirPlay Receiver occupies 5000.

---

## Accounts & passwords

### Sign in

```
admin@perfectwebmetrix.com   / changeme123    (Admin)
zohaib@perfectwebmetrix.com  / manager1234    (Senior Manager)
```

**Change these defaults.** Anyone who reads this file knows them.

### Change your own password (any role)

In the app: click your name (top right) → **Change password**.
Asks for your current password first.

### Reset someone else's password (Admin)

In the app: **Users** → **Edit** on their row → type a new password → **Save
changes**. Leave the field blank to keep their current one.

This signs that person out of any device they were already using.

### Forgot the password / locked out — reset from the terminal

Needs access to this machine and the database, but no login:

```bash
npm --prefix server run reset:password -- admin@perfectwebmetrix.com anewpassword
```

Leaves the person's role untouched. Password must be at least 8 characters.
This is the way back in when nobody can sign in.

### Create the first admin, or promote someone to admin

```bash
npm --prefix server run create:admin -- "Full Name" email@example.com password
```

With no arguments it creates `admin@perfectwebmetrix.com` / `changeme123`.

> **Careful:** if the email already exists, this **changes that person's role to
> Admin**. To reset a password *without* changing a role, use
> `reset:password` above.

### Add a normal user

In the app: **Users** → **Add user**. Admin only.

---

## Workspace settings

In the app: **Settings**. Admin only — managers see it read-only.

| Setting | What it changes |
| ------- | --------------- |
| Organisation name | Sidebar, sign-in page and footer |
| Default currency | Currency for a new lead when the country suggests none |
| Upcoming follow-up window | How many days ahead the Follow-ups page looks |
| Leads per page | Rows shown on the leads list |

---

## MongoDB

MongoDB runs as a background service and restarts with your Mac.

| What you want | Command |
| ------------- | ------- |
| Check it is running | `brew services list \| grep mongo` |
| Start it | `brew services start mongodb/brew/mongodb-community` |
| Stop it | `brew services stop mongodb/brew/mongodb-community` |
| Restart it | `brew services restart mongodb/brew/mongodb-community` |
| Open a database shell | `mongosh perfect-web-metrix` |

If the app says the database is disconnected, check this first.

---

## Database maintenance

All of these are safe to run more than once.

| What it does | Command |
| ------------ | ------- |
| Apply index changes and drop indexes that no longer exist | `npm --prefix server run sync:indexes` |
| Create follow-up records for leads that predate the follow-up feature | `npm --prefix server run backfill:follow-ups` |
| Fill in status history for older leads | `npm --prefix server run backfill:status-timestamps` |
| Link leads to user accounts by their old free-text manager name | `npm --prefix server run link:managers` |
| Move old lead note text into note records | `npm --prefix server run migrate:notes` |

Run `sync:indexes` after any change to a model's indexes.

`link:managers` reports any manager name with no matching user account and
leaves those leads unassigned. Create the missing users, run it again, and
their leads get linked.

The two `backfill` commands were already run on your data — you only need them
again if you import older leads.

---

## Checks before committing

| What it does | Command |
| ------------ | ------- |
| **Run all tests** | `npm test` |
| Backend tests only | `npm run test:server` |
| Frontend tests only | `npm run test:client` |
| Typecheck both sides | `npm run typecheck` |
| Production build of both | `npm run build` |
| Backend types only | `npm --prefix server run typecheck` |
| Frontend lint | `npm --prefix client run lint` |
| Frontend build | `npm --prefix client run build` |

Backend tests run against a **separate database** (`perfect-web-metrix-test`),
which is dropped before and after each run. The harness refuses to start unless
the database name contains "test", so a test run cannot touch your real data.
MongoDB must be running.

---

## Environment variables

Files: `server/.env` and `client/.env`. Both already exist. Copy from
`.env.example` if one goes missing.

### `server/.env`

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `PORT` | `5050` | API port |
| `NODE_ENV` | `development` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/perfect-web-metrix` | Required |
| `JWT_SECRET` | dev value | **Change before deploying** |
| `SESSION_DAYS` | `7` | How long a login lasts |

Generate a real secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `client/.env`

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `VITE_API_BASE_URL` | *(empty)* | Leave empty in development |
| `VITE_PORT` | `5173` | Frontend port |
| `VITE_API_PROXY_TARGET` | `http://localhost:5050` | Where `/api` is forwarded |

Restart the dev server after editing either file.

---

## When something is broken

### "Port already in use"

A previous run did not shut down. Free the ports:

```bash
lsof -ti tcp:5050 | xargs kill -9    # backend
lsof -ti tcp:5173 | xargs kill -9    # frontend
```

Or stop everything at once:

```bash
pkill -f npm-run-all; pkill -f "tsx watch"; pkill -f vite
```

### "Cannot reach the server" in the app

The backend is not running. Start it with `npm run dev:server` and check
http://localhost:5050/api/health.

### Database shows disconnected

```bash
brew services start mongodb/brew/mongodb-community
```

Then restart the backend.

### Session keeps expiring / stuck signed out

Sign out and back in. If `JWT_SECRET` in `server/.env` changed, every existing
login is invalidated by design — everyone signs in again.

### Nobody can sign in at all

```bash
npm --prefix server run reset:password -- youremail@example.com anewpassword
```

---

## Looking at the data directly

Open the shell first:

```bash
mongosh perfect-web-metrix
```

Then:

```js
// How much of everything is there?
db.leads.countDocuments({})
db.communications.countDocuments({})
db.followups.countDocuments({})
db.users.countDocuments({})

// Who can sign in?
db.users.find({}, { name: 1, email: 1, role: 1, isActive: 1 })

// Leads by status
db.leads.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }, { $sort: { n: -1 } }])

// Follow-ups still open
db.followups.find({ status: "pending" }).sort({ dueDate: 1 })
```

### Clearing test data

**These delete real records permanently. Take a backup first.**

```js
// Remove every lead and everything attached to it
db.communications.deleteMany({})
db.followups.deleteMany({})
db.leads.deleteMany({})
```

User accounts are separate and are not touched by the above.

### Backup and restore

```bash
# Back up to ./backup/
mongodump --db=perfect-web-metrix --out=./backup

# Restore that backup
mongorestore --db=perfect-web-metrix ./backup/perfect-web-metrix
```

---

## Deploying

Full instructions are in `DEPLOYMENT.md`. The short version:

```bash
git add -A
git commit -m "Describe the change"
git push                     # GitHub Actions builds and uploads
```

Then cPanel → **Setup Node.js App** → **Restart**.

On the server, the maintenance scripts run from the compiled output because
`tsx` is not installed in production:

```bash
cd ~/leadgeneration
source ~/nodevenv/leadgeneration/20/bin/activate
node dist/scripts/createAdmin.js "Name" email@example.com password
node dist/scripts/resetPassword.js email@example.com newpassword
node dist/scripts/syncIndexes.js
```

## Project layout

```
sales-dashbaord/
├── client/     React + TypeScript + Vite frontend
├── server/     Express + TypeScript + MongoDB backend
├── COMMANDS.md    This file
├── DEPLOYMENT.md  Namecheap hosting, subdomain, Atlas, CI/CD
└── README.md      Architecture, API reference, roles
```

See `README.md` for the API endpoint list and how roles and permissions work.
