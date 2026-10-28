import mongoose from "mongoose";

function safeErrorMessage(error) {
  return String(error.message || "Unknown error")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[MongoDB URI redacted]")
    .replace(/\b(password|passwd|pwd)\s*[:=]\s*[^,;\s]+/gi, "$1=[redacted]");
}

function getDatabaseName(connectionString) {
  const databasePath = decodeURIComponent(new URL(connectionString).pathname);
  const databaseName = databasePath.replace(/^\/+/, "");
  return databaseName || undefined;
}

export async function connectToDatabase() {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    const error = new Error("MONGODB_URI is not set. Add it to server/.env.");
    error.name = "ConfigurationError";
    throw error;
  }

  try {
    const databaseName = getDatabaseName(connectionString);
    await mongoose.connect(
      connectionString,
      databaseName ? { dbName: databaseName } : undefined,
    );
    console.log("Connected to MongoDB.");
  } catch (error) {
    await mongoose.disconnect().catch(() => {});
    if (process.env.NODE_ENV !== "production") {
      console.error("MongoDB connection error:", {
        name: error.name || "Error",
        code: error.code,
        message: safeErrorMessage(error),
      });
    }
    throw error;
  }
}

export function disconnectFromDatabase() {
  return mongoose.disconnect();
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
