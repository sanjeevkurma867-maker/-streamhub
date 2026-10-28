import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { AccessToken } from "livekit-server-sdk";
import LiveStream from "../models/livestream.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// POST /api/live - Create a live stream
router.post("/", auth, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Stream title is required.",
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        message: "Stream title must be 150 characters or fewer.",
      });
    }

    const existingStream = await LiveStream.findOne({
      host: req.user.id,
      status: "live",
    });

    if (existingStream) {
      return res.status(409).json({
        message: "You already have an active live stream.",
        stream: existingStream,
      });
    }

    const stream = await LiveStream.create({
      title: title.trim(),
      description: description || "",
      host: req.user.id,
      roomName: `streamhub-${crypto.randomUUID()}`,
      status: "live",
    });

    const populatedStream = await LiveStream.findById(stream._id).populate(
      "host",
      "username"
    );

    res.status(201).json({ stream: populatedStream });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create live stream.",
    });
  }
});

// GET /api/live - List active streams
router.get("/", async (req, res) => {
  try {
    const streams = await LiveStream.find({ status: "live" })
      .populate("host", "username")
      .sort({ startedAt: -1 })
      .limit(50);

    res.json(streams);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch live streams.",
    });
  }
});

// GET /api/live/:id - Get stream details
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid stream ID.",
      });
    }

    const stream = await LiveStream.findById(req.params.id).populate(
      "host",
      "username"
    );

    if (!stream) {
      return res.status(404).json({
        message: "Live stream not found.",
      });
    }

    res.json(stream);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch live stream.",
    });
  }
});

// POST /api/live/:id/token - Generate LiveKit access token
router.post("/:id/token", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid stream ID.",
      });
    }

    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        message: "Live stream not found.",
      });
    }

    if (stream.status !== "live") {
      return res.status(410).json({
        message: "This live stream has ended.",
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return res.status(503).json({
        message: "Live streaming is not configured on the server.",
      });
    }

    const isHost = String(stream.host) === String(req.user.id);
    const role = isHost ? "host" : req.body.role === "guest" ? "guest" : "viewer";

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: String(req.user.id),
      name: String(req.user.username || "StreamHub User"),
      ttl: "2h",
    });

    accessToken.addGrant({
      roomJoin: true,
      room: stream.roomName,
      canPublish: isHost || role === "guest",
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await accessToken.toJwt();

    res.json({
      token,
      serverUrl,
      role,
      roomName: stream.roomName,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate live stream token.",
    });
  }
});

// POST /api/live/:id/end - End stream (host only)
router.post("/:id/end", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid stream ID.",
      });
    }

    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        message: "Live stream not found.",
      });
    }

    if (String(stream.host) !== String(req.user.id)) {
      return res.status(403).json({
        message: "Only the host can end this stream.",
      });
    }

    if (stream.status === "ended") {
      return res.json({
        message: "Stream has already ended.",
        stream,
      });
    }

    stream.status = "ended";
    stream.endedAt = new Date();
    await stream.save();

    res.json({
      message: "Live stream ended successfully.",
      stream,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to end live stream.",
    });
  }
});

export default router;