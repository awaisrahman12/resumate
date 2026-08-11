# ResuMate — AI Resume Builder & Checker

A friendly full-stack **MERN** website that helps people who are anxious about their resume. Powered by **Google Gemini**, it can:

1. **Create** a polished resume from a short form.
2. **Check / score** an existing resume (upload a PDF) — get a score **out of 10** with strengths, weaknesses, and concrete fixes.
3. **Rewrite / improve** a resume based on that feedback.

> **Every core feature requires an account.** No one can create or check a resume without signing up / signing in — enforced on both the client (protected routes) and the server (JWT auth middleware).

Two ways to sign in:

- **Continue with Google** — one click, no password, email already trusted.
- **Email + password** — the address is **verified by a 6-digit OTP** emailed on signup. Until that code is confirmed, no token is issued and the account can't log in.

---

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS, React Router, axios, react-markdown, `@react-oauth/google`
- **Backend:** Node + Express, MongoDB + Mongoose, JWT + bcryptjs, multer (PDF upload), pdf-parse, nodemailer (OTP email), google-auth-library
- **AI:** `@google/genai`, model `gemini-flash-latest`

---

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — a local `mongod` running, or a MongoDB Atlas connection string
- A **Google Gemini API key** (free, no credit card) — https://aistudio.google.com/apikey

---

## Setup

From the project root:

```bash
npm run install:all
```

This installs dependencies for the root, `server/`, and `client/`.

Then create the backend env file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set at least:

- `MONGODB_URI` — e.g. `mongodb://127.0.0.1:27017/resumate` (local) or your Atlas URI
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — your Google Gemini key
- `SMTP_USER` / `SMTP_PASS` — Gmail address + **app password** (see below) for OTP emails
- `GOOGLE_CLIENT_ID` — OAuth client id (see below), for "Continue with Google"

Then the frontend env file:

```bash
cp client/.env.example client/.env
```

Set `VITE_GOOGLE_CLIENT_ID` to the **same** value as `GOOGLE_CLIENT_ID`.

### Gmail app password (for OTP emails)

Gmail blocks normal passwords for SMTP, so you need a 16-character app password:

1. Turn on **2-Step Verification** — https://myaccount.google.com/signinoptions/two-step-verification
2. Go to **App passwords** — https://myaccount.google.com/apppasswords
3. Name it "ResuMate" and create it. Copy the 16-character code.
4. In `server/.env`: `SMTP_USER=you@gmail.com` and `SMTP_PASS=` that code (spaces are fine).

Check it works before starting the app:

```bash
npm run check:email --prefix server              # verifies the login
npm run check:email --prefix server you@gmail.com  # ...and sends a test email
```

> **"The setting you are looking for is not available for your account."**
> That's Google hiding the App passwords page because **2-Step Verification is
> off** — do step 1 first and the page appears. If it persists: make sure the
> right account is active (check the avatar, or use an incognito window), and
> note that Workspace admins can disable app passwords and the Advanced
> Protection Program removes them entirely.
>
> The app password belongs to the account that generated it — `SMTP_USER` must
> be that exact address, or Gmail returns `535-5.7.8 Username and Password not accepted`.

### Google sign-in client id

1. Open https://console.cloud.google.com/apis/credentials (create a project if needed).
2. Configure the **OAuth consent screen** → External → fill in app name + your email.
3. **Create credentials → OAuth client ID → Web application**.
4. Under **Authorized JavaScript origins**, add `http://localhost:5173` (and your live domain later).
5. Copy the **Client ID** into `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client).

Both are optional to start: without SMTP, email signup fails at the send step; without the client id, the Google button simply doesn't render.

---

## Run (development)

Make sure MongoDB is running, then from the project root:

```bash
npm run dev
```

- Backend API: http://localhost:5000
- Frontend: http://localhost:5173

The frontend proxies API calls to the backend.

---

## Deployment

ResuMate deploys to **Vercel** as a single project — the React app is served
statically and the Express backend runs as a serverless function under `/api`.
See **[DEPLOY.md](DEPLOY.md)** for the full step-by-step (env vars, MongoDB Atlas
network access, and pointing a custom domain at it).

---

## Project structure

```
Resume Builder/
  package.json        # root — runs server + client together
  server/             # Express API (auth + AI + MongoDB)
  client/             # React + Vite + Tailwind app
```

See `server/` and `client/` for details.

---

## How auth gating works

- **Client:** `/dashboard`, `/create`, `/check`, `/rewrite`, `/history` are wrapped in `ProtectedRoute`. Logged-out users are redirected to `/login`.
- **Server:** every `/api/resume/*` route sits behind JWT auth middleware and returns **401** without a valid token — so the gate holds even if the client is bypassed.

## How email verification works

`POST /api/auth/signup` creates the account **unverified and returns no token**, then emails a 6-digit code. The code is stored only as a bcrypt hash with a 10-minute expiry, capped at 5 wrong attempts, and resends are on a 60-second cooldown. `POST /api/auth/verify-otp` with the right code flips `emailVerified` and returns the JWT.

Logging in before verifying returns **403** with `needsVerification: true`, so the UI can bounce the user to `/verify-email` and offer a fresh code.

Google accounts skip OTP entirely — Google has already verified the address. Signing in with Google using an email that already has a password account **links** the two, so either method reaches the same account.
