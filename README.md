# ResuMate — AI Resume Builder & Checker

A friendly full-stack **MERN** website that helps people who are anxious about their resume. Powered by **Google Gemini**, it can:

1. **Create** a polished resume from a short form.
2. **Check / score** an existing resume (upload a PDF) — get a score **out of 10** with strengths, weaknesses, and concrete fixes.
3. **Rewrite / improve** a resume based on that feedback.

> **Every core feature requires an account.** No one can create or check a resume without signing up / signing in — enforced on both the client (protected routes) and the server (JWT auth middleware).

---

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS, React Router, axios, react-markdown
- **Backend:** Node + Express, MongoDB + Mongoose, JWT + bcryptjs, multer (PDF upload), pdf-parse
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
