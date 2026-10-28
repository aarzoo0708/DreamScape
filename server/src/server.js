import "dotenv/config";
import createApp from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./config/db.js";

async function startServer() {
  const port = Number(process.env.PORT) || 5000;

  try {
    await connectToDatabase();
  } catch (error) {
    console.error("MongoDB connection failed. The API server was not started.");
    if (error.name === "ConfigurationError") {
      console.error(error.message);
    } else {
      console.error(`Connection error type: ${error.name}`);
      console.error(
        "Check the MongoDB URI, Atlas network access, and database user permissions.",
      );
    }
    process.exitCode = 1;
    return;
  }

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`DreamScape API is running at http://localhost:${port}`);
  });

  server.on("error", async (error) => {
    console.error(`Unable to start DreamScape API on port ${port}:`, error.message);
    try {
      await disconnectFromDatabase();
    } catch {
      console.error("Unable to close the MongoDB connection after startup failed.");
    }
    process.exitCode = 1;
  });
}

startServer();
