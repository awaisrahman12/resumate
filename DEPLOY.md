# Deploying ResuMate to Vercel

ResuMate runs as a **single Vercel project**: the React frontend is served as static files, and the Express backend runs as one serverless function under `/api`. Both share one domain, so there's no CORS to configure.

The build is driven by [`vercel.json`](vercel.json) at the repo root (static build for `client/`, `@vercel/node` for `server/api/index.js`).

---

## 1. Import the repo

1. Go to https://vercel.com/new and sign in with GitHub.
2. Import **`awaisrahman12/resumate`**.
3. Framework Preset: **Other** (the `vercel.json` tells Vercel what to do — don't override the build/output settings).
4. Don't deploy yet — add the environment variables first (next step).

## 2. Environment variables

In the import screen (or **Project → Settings → Environment Variables**), add these for the **Production** environment. Copy the values from your local `server/.env`:

| Name | Value |
|---|---|
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | your long random secret |
| `JWT_EXPIRES_IN` | `7d` |
| `GEMINI_API_KEY` | your Google Gemini key |
| `CLIENT_URL` | your production URL, e.g. `https://resumateai.co.uk` |

> These live only in Vercel — never commit them. `.env` stays gitignored.

Then click **Deploy**.

## 3. Let Vercel reach MongoDB Atlas

Vercel's serverless functions use **dynamic outbound IPs**, so you can't allowlist a fixed one.

1. MongoDB Atlas → **Network Access** → **Add IP Address**.
2. Choose **Allow access from anywhere** → `0.0.0.0/0` → Confirm.

Without this, the live site can't connect to the database (auth/history/etc. will fail even though the site loads).

## 4. Verify the deployment

Once the build finishes, Vercel gives you a `*.vercel.app` URL.

- Visit `https://<your-app>.vercel.app/api/health` → should return `{"ok":true}`.
- Open the site, **sign up**, then run create → check (upload a PDF < 4 MB) → rewrite → history.

## 5. Custom domain — resumateai.co.uk

1. **Project → Settings → Domains → Add** `resumateai.co.uk` (add `www.resumateai.co.uk` too; Vercel will offer to redirect one to the other).
2. Vercel shows the exact DNS records to create. At your `.co.uk` registrar's DNS settings, add what it lists — typically:
   - **A** record: `@` → `76.76.21.21`
   - **CNAME** record: `www` → `cname.vercel-dns.com`
3. Save. DNS can take anywhere from a few minutes to a few hours to propagate. Vercel issues the HTTPS certificate automatically once it detects the records.
4. After the domain is live, set the `CLIENT_URL` env var to `https://resumateai.co.uk` and redeploy (Deployments → ⋯ → Redeploy) so it takes effect.

---

## Notes & limits (Vercel Hobby plan)

- **Upload size:** PDFs are capped at **4 MB** — Vercel enforces a hard 4.5 MB request-body limit on serverless functions.
- **Cold starts:** after a period of inactivity, the first request wakes the function and is a little slower. Subsequent requests are fast.
- **Function timeout:** AI calls are allowed up to 60 seconds, which is plenty for Gemini here.
- **Auto-deploy:** every `git push` to `master` triggers a new deployment automatically.
