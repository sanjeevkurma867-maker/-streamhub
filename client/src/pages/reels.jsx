import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/authcontext.jsx";

export default function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef(new Map());

  useEffect(() => {
    let active = true;

    async function loadReels() {
      try {
        const response = await api.get("/videos?type=reel");
        const data = response.data;
        const items = Array.isArray(data) ? data : data.videos || [];

        if (active) {
          setReels(items);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Could not load Reels."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReels();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.65
          ) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.65, 1] }
    );

    videoRefs.current.forEach((video) => {
      if (video) {
        observer.observe(video);
      }
    });

    return () => observer.disconnect();
  }, [reels]);

  async function toggleLike(reelId) {
    if (!user) {
      setError("Log in to like a Reel.");
      return;
    }

    try {
      const response = await api.post(`/videos/${reelId}/like`);
      const result = response.data;

      setReels((current) =>
        current.map((reel) =>
          reel._id === reelId
            ? {
                ...reel,
                likes: result.likes ?? reel.likes,
                liked: result.liked ?? !reel.liked,
              }
            : reel
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update like."
      );
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <p>Loading Reels...</p>
      </main>
    );
  }

  return (
    <main className="page-shell reels-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">QUICK WATCH</p>
          <h1>Reels</h1>
        </div>

        <button
          className="secondary-button"
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? "Unmute all" : "Mute all"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {reels.length === 0 ? (
        <section className="empty-state">
          <h2>No Reels yet</h2>
          <p>Upload a short video to be the first creator here.</p>
          <Link className="primary-button" to="/upload">
            Upload a Reel
          </Link>
        </section>
      ) : (
        <div className="reels-feed">
          {reels.map((reel) => (
            <article className="reel-card" key={reel._id}>
              <video
                ref={(node) => {
                  if (node) {
                    videoRefs.current.set(reel._id, node);
                  } else {
                    videoRefs.current.delete(reel._id);
                  }
                }}
                src={reel.videoUrl}
                poster={reel.thumbnailUrl || undefined}
                loop
                muted={muted}
                playsInline
                controls
              />

              <div className="reel-overlay">
                <h2>{reel.title}</h2>
                <p>{reel.description}</p>
                <p className="muted">
                  @{reel.creator?.username || "creator"}
                </p>

                <div className="reel-actions">
                  <button
                    className="secondary-button"
                    onClick={() => toggleLike(reel._id)}
                  >
                    {reel.liked ? "♥ Liked" : "♡ Like"} ·{" "}
                    {reel.likes?.length || 0}
                  </button>

                  <Link
                    className="secondary-button"
                    to={`/watch/${reel._id}`}
                  >
                    Open Reel
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}