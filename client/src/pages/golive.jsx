import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { FiRadio, FiAlertCircle } from "react-icons/fi";

export default function GoLive() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title for your live stream.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/live", {
        title: title.trim(),
        description: description.trim(),
      });

      const stream = response.data.stream || response.data;

      if (!stream._id) {
        throw new Error("The server did not return a stream ID.");
      }

      navigate(`/live/${stream._id}?host=true`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start your live stream."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-container auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-icon">
          <FiRadio size={32} />
        </div>

        <h1>Go Live</h1>
        <p>Set up your stream and connect with your audience.</p>

        {error && (
          <div className="error-message">
            <FiAlertCircle />
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="stream-title">Stream Title</label>
          <input
            id="stream-title"
            type="text"
            placeholder="What are you streaming?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stream-description">Description</label>
          <textarea
            id="stream-description"
            placeholder="Tell viewers about your stream..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>

        <button
          className="btn-primary btn-full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Preparing Stream..." : "Start Live Stream"}
        </button>
      </form>
    </main>
  );
}