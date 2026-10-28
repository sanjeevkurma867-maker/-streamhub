import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { FiRadio, FiUsers } from "react-icons/fi";

export default function LiveList() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchStreams() {
      try {
        const response = await api.get("/live");

        if (active) {
          const data = response.data;
          setStreams(Array.isArray(data) ? data : data.streams || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load live streams."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchStreams();

    const interval = setInterval(fetchStreams, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <h1>
            <FiRadio /> Live Streams
          </h1>
          <p>Watch creators broadcasting live on StreamHub.</p>
        </div>

        <Link to="/live/new" className="btn-primary">
          Go Live
        </Link>
      </div>

      {loading ? (
        <div className="loading-screen">Loading live streams...</div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : streams.length === 0 ? (
        <div className="empty-state">
          <FiRadio size={36} />
          <h2>No one is live right now</h2>
          <p>Be the first to start a live stream!</p>
          <Link to="/live/new" className="btn-primary">
            Start Streaming
          </Link>
        </div>
      ) : (
        <div className="video-grid">
          {streams.map((stream) => (
            <Link
              to={`/live/${stream._id}`}
              className="video-card live-card"
              key={stream._id}
            >
              <div className="video-thumbnail">
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt={stream.title} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <FiRadio size={36} />
                  </div>
                )}

                <span className="live-badge">LIVE</span>
              </div>

              <div className="video-card-info">
                <h3>{stream.title || "Live Stream"}</h3>
                <p>
                  {stream.host?.username ||
                    stream.hostUsername ||
                    "StreamHub Creator"}
                </p>

                <div className="video-card-meta">
                  <span>
                    <FiUsers />
                    {stream.viewerCount ?? stream.viewers?.length ?? 0} watching
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}