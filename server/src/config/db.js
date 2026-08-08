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
