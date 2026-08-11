import { connectDBServerless } from "../src/config/db.js";
import { createApp } from "../src/app.js";

/**
 * Vercel serverless entry point.
 *
 * The Express app is created once (module scope, so it's reused across warm
 * invocations) and the DB connection is cached by connectDBServerless. Each
 * request awaits the (possibly cached) connection, then hands the raw
 * req/res straight to Express, which already defines all /api routes.
 */
const app = createApp();

export default async function handler(req, res) {
  await connectDBServerless();
  return app(req, res);
}
