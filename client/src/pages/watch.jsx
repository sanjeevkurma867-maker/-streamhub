import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiHeart, FiMessageCircle, FiEye, FiArrowLeft } from "react-icons/fi";
import api from "../api.js";
import { useAuth } from "../context/authcontext.jsx";

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadVideo() {
      try {
        const [videoResponse, commentsResponse] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get(`/videos/${id}/comments`),
        ]);

        if (!active) return;

        setVideo(videoResponse.data);
        setComments(
          Array.isArray(commentsResponse.data) ? commentsResponse.data : []
        );
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load this video."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    setLoading(true);
    setError("");
    loadVideo();

    return () => {
      active = false;
    };
  }, [id]);

  async function toggleLike() {
    if (!user) {
      setError("Please log in to like this video.");
      return;
    }

    try {
      const response = await api.post(`/videos/${id}/like`);

      setVideo((current) => {
        if (!current) return current;

        const currentLikes = current.likes || [];
        const userId = String(user._id || user.id);

        const likes = response.data.liked
          ? [
              ...currentLikes.filter(
                (like) => String(like._id || like) !== userId
              ),
              userId,
            ]
          : currentLikes.filter(
              (like) => String(like._id || like) !== userId
            );

        return { ...current, likes };
      });

      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update like.");
    }
  }

  async function submitComment(event) {
    event.preventDefault();

    if (!user) {
      setError("Please log in to comment.");
      return;
    }

    if (!commentText.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post(`/videos/${id}/comments`, {
        text: commentText.trim(),
      });

      setComments((current) => [response.data, ...current]);
      setCommentText("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="loading-screen">Loading video...</div>;
  }

  if (error && !video) {
    return (
      <main className="page-container">
        <p className="error-message">{error}</p>
        <Link to="/" className="btn-primary">
          <FiArrowLeft /> Back home
        </Link>
      </main>
    );
  }

  if (!video) {
    return <main className="page-container">Video not found.</main>;
  }

  const creator = video.creator || {};
  const userId = String(user?._id || user?.id || "");

  const liked = (video.likes || []).some(
    (like) => String(like._id || like) === userId
  );

  return (
    <main className="page-container watch-page">
      {error && <p className="error-message">{error}</p>}

      <div className="watch-layout">
        <section className="watch-main">
          <video
            className="watch-player"
            src={video.videoUrl}
            poster={video.thumbnailUrl || undefined}
            controls
            autoPlay
            playsInline
          />

          <h1>{video.title}</h1>

          <div className="watch-meta">
            <span>
              <FiEye /> {video.views || 0} views
            </span>

            <button
              type="button"
              className={liked ? "like-button liked" : "like-button"}
              onClick={toggleLike}
            >
              <FiHeart /> {(video.likes || []).length} Likes
            </button>
          </div>

          <div className="creator-info">
            <Link
              to={creator._id ? `/profile/${creator._id}` : "/"}
              className="creator-name"
            >
              {creator.username || "StreamHub Creator"}
            </Link>
          </div>

          {video.description && (
            <p className="video-description">{video.description}</p>
          )}
        </section>

        <aside className="comments-section">
          <h2>
            <FiMessageCircle /> Comments ({comments.length})
          </h2>

          <form onSubmit={submitComment} className="comment-form">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={user ? "Write a comment..." : "Log in to comment"}
              maxLength={1000}
              rows={3}
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </form>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p>No comments yet. Start the conversation!</p>
            ) : (
              comments.map((comment) => (
                <article className="comment-item" key={comment._id}>
                  <strong>{comment.user?.username || "User"}</strong>
                  <p>{comment.text}</p>
                  <small>
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleString()
                      : ""}
                  </small>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}