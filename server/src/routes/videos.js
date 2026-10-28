import express from "express";
import mongoose from "mongoose";
import Video from "../models/video.js";
import Comment from "../models/comment.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET /api/videos - Get videos, reels, and search results
router.get("/", async (req, res) => {
  try {
    const { type, search, page = 1 } = req.query;
    const limit = 12;
    const pageNumber = Math.max(1, Number(page) || 1);
    const filter = {};

    if (type === "video" || type === "reel") {
      filter.type = type;
    }

    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const videos = await Video.find(filter)
      .populate("creator", "username")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .lean();

    return res.json(videos);
  } catch (error) {
    console.error("GET /api/videos error:", error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
});

// GET /api/videos/:id - Get one video and increment views
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID." });
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("creator", "username");

    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    return res.json(video);
  } catch (error) {
    console.error("GET /api/videos/:id error:", error);
    return res.status(500).json({ message: "Failed to fetch video." });
  }
});

// POST /api/videos - Save video metadata
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      videoUrl,
      thumbnailUrl,
      publicId,
      duration,
    } = req.body;

    if (typeof title !== "string" || !title.trim() || !videoUrl) {
      return res.status(400).json({
        message: "Video title and video URL are required.",
      });
    }

    if (type && !["video", "reel"].includes(type)) {
      return res.status(400).json({ message: "Invalid video type." });
    }

    if (type === "reel" && Number(duration) > 60) {
      return res.status(400).json({
        message: "Reels must be 60 seconds or shorter.",
      });
    }

    const video = await Video.create({
      title: title.trim(),
      description: description || "",
      type: type || "video",
      videoUrl,
      thumbnailUrl: thumbnailUrl || "",
      publicId: publicId || "",
      duration: Number(duration) || 0,
      creator: req.user.id,
    });

    const populatedVideo = await Video.findById(video._id).populate(
      "creator",
      "username"
    );

    return res.status(201).json(populatedVideo);
  } catch (error) {
    console.error("POST /api/videos save error:", error);

    return res.status(500).json({
      message: "Failed to save video.",
      error: error.message,
    });
  }
});

// DELETE /api/videos/:id - Delete a video owned by the logged-in user
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID." });
    }

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    if (String(video.creator) !== String(req.user.id)) {
      return res.status(403).json({
        message: "You can only delete your own videos.",
      });
    }

    await Comment.deleteMany({ video: video._id });
    await video.deleteOne();

    return res.json({ message: "Video deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/videos/:id error:", error);
    return res.status(500).json({ message: "Failed to delete video." });
  }
});

// POST /api/videos/:id/like - Toggle a like
router.post("/:id/like", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID." });
    }

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    const userId = String(req.user.id);
    const alreadyLiked = video.likes.some(
      (like) => String(like) === userId
    );

    if (alreadyLiked) {
      video.likes = video.likes.filter(
        (like) => String(like) !== userId
      );
    } else {
      video.likes.push(req.user.id);
    }

    await video.save();

    return res.json({
      liked: !alreadyLiked,
      likes: video.likes.length,
    });
  } catch (error) {
    console.error("POST /api/videos/:id/like error:", error);
    return res.status(500).json({ message: "Failed to update like." });
  }
});

// GET /api/videos/:id/comments - Get comments
router.get("/:id/comments", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID." });
    }

    const comments = await Comment.find({ video: req.params.id })
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(comments);
  } catch (error) {
    console.error("GET /api/videos/:id/comments error:", error);
    return res.status(500).json({ message: "Failed to fetch comments." });
  }
});

// POST /api/videos/:id/comments - Add a comment
router.post("/:id/comments", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID." });
    }

    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        message: "Comment must be 1000 characters or fewer.",
      });
    }

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    const comment = await Comment.create({
      text,
      video: video._id,
      user: req.user.id,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "username"
    );

    return res.status(201).json(populatedComment);
  } catch (error) {
    console.error("POST /api/videos/:id/comments error:", error);
    return res.status(500).json({ message: "Failed to add comment." });
  }
});

export default router;