import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/authcontext.jsx";

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("video");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

    if (!file) {
      setError("Choose a video file first.");
      return;
    }

    if (!cloudName || !uploadPreset) {
      setError(
        "Cloudinary is not configured. Add your cloud name and unsigned upload preset to client/.env."
      );
      return;
    }

    try {
      setBusy(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploaded = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploaded.error?.message || "Video upload failed."
        );
      }

      const response = await api.post("/videos", {
        title: title.trim(),
        description: description.trim(),
        type,
        videoUrl: uploaded.secure_url,
        thumbnailUrl: uploaded.thumbnail_url || "",
        publicId: uploaded.public_id,
        duration: uploaded.duration || 0,
      });

      const video = response.data.video || response.data;
      navigate(`/watch/${video._id}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not upload the video."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell narrow-page">
      <section className="form-card">
        <p className="eyebrow">SHARE WITH STREAMHUB</p>

        <h1>Upload a {type === "reel" ? "Reel" : "video"}</h1>

        <p className="muted">
          Signed in as {user?.username || "creator"}
        </p>

        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={120}
              placeholder="Give your video a title"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              maxLength={3000}
              placeholder="What is this video about?"
            />
          </label>

          <label>
            Content type
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="video">Regular video</option>
              <option value="reel">Short Reel</option>
            </select>
          </label>

          <label>
            Video file
            <input
              type="file"
              accept="video/*"
              required
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
            />
          </label>

          {error && (
            <p className="error-message">{error}</p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={busy}
          >
            {busy ? "Uploading..." : "Upload video"}
          </button>
        </form>
      </section>
    </main>
  );
}