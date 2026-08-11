import mongoose from "mongoose";

/**
 * Connect to MongoDB using MONGODB_URI from the environment.
 * Exits the process on failure so we don't run the API without a database.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
}

/**
 * Serverless-safe connect for platforms like Vercel, where the same process is
 * reused across many invocations. We must NOT open a new connection every call
 * and must NOT call process.exit on failure.
 *
 * The connect promise is cached on globalThis so that concurrent cold-start
 * invocations share a single connection instead of each opening their own.
 */
export async function connectDBServerless() {
  // Already connected (readyState 1) — reuse it.
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in the environment.");
  }

  mongoose.set("strictQuery", true);

  // Reuse an in-flight connect promise if one is already pending.
  if (!globalThis.__mongoConnPromise) {
    globalThis.__mongoConnPromise = mongoose.connect(uri).catch((err) => {
      // Clear the cache so the next invocation can retry instead of being
      // stuck awaiting a permanently-rejected promise.
      globalThis.__mongoConnPromise = undefined;
      throw err;
    });
  }

  await globalThis.__mongoConnPromise;
  return mongoose.connection;
}
