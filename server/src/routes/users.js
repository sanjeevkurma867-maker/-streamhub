import express from "express";
import mongoose from "mongoose";
import User from "../models/user.js";
import Video from "../models/video.js";

const router = express.Router();

// GET /api/users/:id - Get creator profile and videos
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let user;

    if (mongoose.isValidObjectId(id)) {
      user = await User.findById(id).select("username createdAt");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const videos = await Video.find({ creator: user._id })
      .populate("creator", "username")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      },
      videos,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load user profile." });
  }
});

export default router;