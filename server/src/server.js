import "dotenv/config";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start();
