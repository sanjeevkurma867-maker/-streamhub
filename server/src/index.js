import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import userRoutes from "./routes/users.js";
import liveRoutes from "./routes/live.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "StreamHub API is running!",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/live", liveRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(err.status || 500).json({
    message: "An unexpected server error occurred.",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected successfully!");
    } else {
      console.warn("MONGO_URI is missing. Database features will not work.");
    }

    app.listen(PORT, () => {
      console.log(`StreamHub API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start StreamHub:", error.message);
    process.exit(1);
  }
}

startServer();