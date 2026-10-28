import mongoose from "mongoose";

const liveStreamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["live", "ended"],
      default: "live",
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

liveStreamSchema.index({ status: 1, startedAt: -1 });

const LiveStream = mongoose.model("LiveStream", liveStreamSchema);

export default LiveStream;