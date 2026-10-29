import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import healthRoutes from "./routes/healthRoutes.js";
import imageUploadRoutes from "./routes/imageUploadRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import personalRoutes from "./routes/personalRoutes.js";

function safeDevelopmentErrorMessage(error) {
  return String(error.message || "Unknown error")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[MongoDB URI redacted]")
    .replace(/\b(password|passwd|pwd)\s*[:=]\s*[^,;\s]+/gi, "$1=[redacted]");
}

function createApp() {
  const app = express();
  const frontendOrigin =
    process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const allowedFrontendOrigins = new Set([frontendOrigin]);

  try {
    const parsedOrigin = new URL(frontendOrigin);
    allowedFrontendOrigins.add(parsedOrigin.origin);
    if (parsedOrigin.hostname === "localhost") {
      parsedOrigin.hostname = "127.0.0.1";
      allowedFrontendOrigins.add(parsedOrigin.origin);
    } else if (parsedOrigin.hostname === "127.0.0.1") {
      parsedOrigin.hostname = "localhost";
      allowedFrontendOrigins.add(parsedOrigin.origin);
    }
  } catch {
    // Preserve the configured origin exactly if it is not a URL.
  }

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedFrontendOrigins.has(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn("Blocked DreamScape API request from an unconfigured frontend origin:", origin);
      }
      return callback(null, false);
    },
  }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", healthRoutes);
  app.use("/api", imageUploadRoutes);
  app.use("/api/memories", memoryRoutes);
  app.use("/api/personal", personalRoutes);

  app.use((request, response) => {
    response.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  app.use((error, request, response, next) => {
    const statusCode = error.name === "ValidationError"
      ? 400
      : error.status === 413 || error.type === "entity.too.large"
        ? 413
        : error.status === 400
          ? 400
          : 500;

    if (statusCode === 500) {
      if (process.env.NODE_ENV !== "production") {
        console.error("API request failed:", {
          name: error.name || "Error",
          code: error.code,
          message: safeDevelopmentErrorMessage(error),
          databaseName: mongoose.connection.name || "(empty)",
        });
      } else {
        console.error("API request failed:", error.name || "Error");
      }
    }

    response.status(statusCode).json({
      success: false,
      message: error.name === "ValidationError"
        ? "Memory validation failed"
        : statusCode === 400
          ? "Invalid request body"
          : statusCode === 413
            ? "Request body is too large"
            : "Internal server error",
    });
  });

  return app;
}

export default createApp;
