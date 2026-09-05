# Deploying to Namecheap shared hosting

Target: **https://leadgeneration.perfectwebmetrix.com**
Repository: **https://github.com/Asifkhann/pwm_lead_generation**

The app runs as **one Node process** that serves both the API and the site, so
there is a single application to configure in cPanel.

Work through the sections in order. Steps 1–4 are one-time setup; after that,
deploying is just pushing to `main`.

- [1. Database — MongoDB Atlas](#1-database--mongodb-atlas)
- [2. Subdomain and SSL](#2-subdomain-and-ssl)
- [3. The Node.js application in cPanel](#3-the-nodejs-application-in-cpanel)
- [4. Deployment from the repository](#4-deployment-from-the-repository)
- [5. First sign-in](#5-first-sign-in)
- [Deploying an update](#deploying-an-update)
- [If something goes wrong](#if-something-goes-wrong)

---

## 1. Database — MongoDB Atlas

Namecheap shared hosting provides MySQL only, so MongoDB lives outside it. The
free tier is enough for this workload.

1. Sign up at **https://www.mongodb.com/cloud/atlas** and create a free **M0**
   cluster. Pick the region closest to your hosting.
2. **Database Access** → *Add New Database User*. Username and a strong
   password; role **Read and write to any database**. Save the password.
3. **Network Access** → *Add IP Address*.
   - Shared hosting sends traffic from a shared IP that Namecheap can change,
     so **Allow access from anywhere** (`0.0.0.0/0`) is normally required.
   - Access is still protected by the database user and password.
   - If Namecheap gives you a guaranteed static outbound IP, allow only that.
4. **Connect** → *Drivers* → copy the connection string. It looks like:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   **Insert the database name before the `?`:**

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/perfect-web-metrix?retryWrites=true&w=majority
   ```

   Without it, the data goes into a database called `test`.

   If the password contains `@ : / ? # [ ] %`, URL-encode it (`@` → `%40`).

---

## 2. Subdomain and SSL

1. cPanel → **Domains** → *Create A New Domain*.
   - Domain: `leadgeneration.perfectwebmetrix.com`
   - Untick *Share document root*.
   - Document root: `leadgeneration/public` — the same folder the Node app will
     use in the next step.
2. Wait for DNS to resolve, then cPanel → **SSL/TLS Status** → tick the
   subdomain → **Run AutoSSL**.

> **SSL is not optional here.** In production the session cookie is issued with
> the `Secure` flag, so a browser will refuse to store it over plain HTTP and
> **nobody will be able to sign in**. Confirm the padlock works before going
> further.

---

## 3. The Node.js application in cPanel

cPanel → **Setup Node.js App** → *Create Application*.

| Field | Value |
| ----- | ----- |
| Node.js version | 20 or newer |
| Application mode | Production |
| Application root | `leadgeneration` |
| Application URL | `leadgeneration.perfectwebmetrix.com` |
| Application startup file | `dist/server.js` |

Then add the **environment variables** (same screen, *Add Variable*):

| Name | Value |
| ---- | ----- |
| `NODE_ENV` | `production` |
| `CLIENT_DIST_PATH` | `./public` |
| `CLIENT_ORIGIN` | `https://leadgeneration.perfectwebmetrix.com` |
| `MONGODB_URI` | the Atlas string from step 1 |
| `JWT_SECRET` | a fresh random value — see below |
| `SESSION_DAYS` | `7` |

Generate the secret on your own machine and paste the result:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do **not** reuse the development value in `server/.env`. Changing `JWT_SECRET`
later signs everybody out, which is the intended way to revoke all sessions.

Leave `PORT` unset — Passenger assigns it.

Click **Create**. It will fail to start until step 4 puts the files there; that
is expected.

---

## 4. Deployment from the repository

Two routes. **The first is recommended** — a Vite and TypeScript build needs
development dependencies and more memory than a shared plan reliably provides,
so it is safer to build on GitHub and upload only the finished output.

### Route A — GitHub Actions builds and uploads (recommended)

Already configured in `.github/workflows/deploy.yml`.

1. cPanel → **FTP Accounts** → create an account with the directory set to
   `/home/YOUR_CPANEL_USER` (it needs to reach `leadgeneration/`).
2. GitHub → repository → **Settings → Secrets and variables → Actions** → add:

   | Secret | Value |
   | ------ | ----- |
   | `FTP_SERVER` | `ftp.perfectwebmetrix.com` |
   | `FTP_USERNAME` | the full FTP username, e.g. `deploy@perfectwebmetrix.com` |
   | `FTP_PASSWORD` | its password |

3. Push to `main`. The workflow installs, typechecks, tests, builds, assembles
   a release folder and uploads it to `/leadgeneration/`.
4. cPanel → **Setup Node.js App** → **Restart** so Passenger picks up the new
   files.

What gets uploaded:

```
leadgeneration/
├── dist/          compiled server
├── public/        built frontend
├── package.json
└── node_modules/  production dependencies only (~16 MB)
```

### Route B — cPanel's own Git deployment

Use this if you would rather not put FTP credentials into GitHub.

1. Edit `.cpanel.yml` and replace every `CPANEL_USER` with your cPanel
   username. Commit and push.
2. cPanel → **Git™ Version Control** → *Create* → clone
   `https://github.com/Asifkhann/pwm_lead_generation.git`.
   For a private repository, add a cPanel SSH key to GitHub as a deploy key and
   use the SSH clone URL.
3. **Manage** → **Deploy HEAD Commit** after each push.

This builds on the server. If it runs out of memory, switch to Route A.

---

## 5. First sign-in

There are no accounts until you create one. cPanel → **Terminal** (or SSH):

```bash
cd ~/leadgeneration
source ~/nodevenv/leadgeneration/20/bin/activate
node dist/scripts/createAdmin.js "Your Name" you@perfectwebmetrix.com yourpassword
```

The environment variables from step 3 are picked up automatically inside that
activated environment. If `MONGODB_URI` is not found, prefix the command with
it:

```bash
MONGODB_URI="mongodb+srv://..." node dist/scripts/createAdmin.js "Your Name" you@example.com yourpassword
```

Then open **https://leadgeneration.perfectwebmetrix.com** and sign in.

The same folder has the other maintenance scripts — `resetPassword.js`,
`syncIndexes.js` — run them the same way.

---

## Deploying an update

```bash
git add -A
git commit -m "Describe the change"
git push
```

Route A deploys automatically; press **Restart** in Setup Node.js App
afterwards. Route B needs **Deploy HEAD Commit** in Git Version Control.

Run `node dist/scripts/syncIndexes.js` after any change to database indexes.

---

## If something goes wrong

| Symptom | Cause and fix |
| ------- | ------------- |
| Sign-in appears to work but you land back on the sign-in page | The cookie was rejected. The site must be on **https** — run AutoSSL for the subdomain. |
| "Cannot reach the server" | Passenger is not running the app. Check **Setup Node.js App** → the log file, and that the startup file is `dist/server.js`. |
| Site loads but every request fails | `MONGODB_URI` is wrong, or the server's IP is not allowed in Atlas → **Network Access**. |
| Blank page, API works | The frontend was not uploaded. Check `leadgeneration/public/index.html` exists and `CLIENT_DIST_PATH` is `./public`. |
| Everyone signed out after a deploy | `JWT_SECRET` changed. Set it once and keep it. |
| `MODULE_NOT_FOUND` on start | `node_modules` did not upload. Re-run the deploy, or run `npm ci --omit=dev` in `~/leadgeneration`. |
| Build fails on the server (Route B) | Shared hosting ran out of memory. Use Route A. |

Application logs: cPanel → **Setup Node.js App** → the log path shown for the
application, or `~/leadgeneration/stderr.log`.
