import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("videos");

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        const [videosResponse, liveResponse] = await Promise.all([
          api.get("/videos"),
          api.get("/live"),
        ]);

        const videoData = videosResponse.data;
        const liveData = liveResponse.data;

        if (active) {
          setVideos(
            Array.isArray(videoData)
              ? videoData
              : videoData.videos || []
          );

          setLiveStreams(
            Array.isArray(liveData)
              ? liveData
              : liveData.streams || []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Could not load StreamHub content."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, []);

  const filteredVideos = videos.filter((video) => {
    const matchesTab =
      activeTab === "reels"
        ? video.type === "reel"
        : video.type !== "reel";

    const term = search.trim().toLowerCase();

    const searchableText = `
      ${video.title || ""}
      ${video.description || ""}
      ${video.creator?.username || ""}
    `.toLowerCase();

    return (
      matchesTab &&
      (!term || searchableText.includes(term))
    );
  });

  const filteredStreams = liveStreams.filter((stream) => {
    const term = search.trim().toLowerCase();

    const searchableText = `
      ${stream.title || ""}
      ${stream.host?.username || ""}
    `.toLowerCase();

    return !term || searchableText.includes(term);
  });

  return (
    <main className="app-main home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">YOUR VIDEO WORLD</p>

          <h1>Watch what moves you.</h1>

          <p>
            Discover videos, scroll through Reels, and join
            creators live on StreamHub.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/reels">
              Explore Reels
            </Link>

            <Link className="secondary-button" to="/live">
              Watch live
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR NEXT WATCH</p>
            <h2>Explore StreamHub</h2>
          </div>

          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search videos or creators"
            aria-label="Search videos or creators"
          />
        </div>

        {/* Content Tabs */}
        <div className="tabs-row">
          <button
            type="button"
            className={
              activeTab === "videos"
                ? "tab-button active"
                : "tab-button"
            }
            onClick={() => setActiveTab("videos")}
          >
            Videos
          </button>

          <button
            type="button"
            className={
              activeTab === "reels"
                ? "tab-button active"
                : "tab-button"
            }
            onClick={() => setActiveTab("reels")}
          >
            Reels
          </button>

          <button
            type="button"
            className={
              activeTab === "live"
                ? "tab-button active"
                : "tab-button"
            }
            onClick={() => setActiveTab("live")}
          >
            Live now
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="empty-state">
            <p className="muted">Loading StreamHub content...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="error-message">
            {error}
          </div>
        ) : activeTab === "live" ? (
          /* Live Streams */
          filteredStreams.length === 0 ? (
            <section className="empty-state">
              <h3>No live streams right now</h3>

              <p>
                Check back soon or start your own stream.
              </p>

              <Link
                className="primary-button"
                to="/live/new"
              >
                Go live
              </Link>
            </section>
          ) : (
            <div className="video-grid">
              {filteredStreams.map((stream) => (
                <Link
                  className="content-card live-card"
                  to={`/live/${stream._id}`}
                  key={stream._id}
                >
                  <div className="card-placeholder live-placeholder">
                    <span className="live-badge">
                      <span className="live-dot"></span>
                      LIVE
                    </span>
                  </div>

                  <div className="card-copy">
                    <h3>{stream.title}</h3>

                    <p>
                      @{stream.host?.username || "creator"}
                    </p>

                    <span className="muted">
                      {stream.viewerCount || 0} watching
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          /* Videos and Reels */
          filteredVideos.length === 0 ? (
            <section className="empty-state">
              <h3>
                No{" "}
                {activeTab === "reels" ? "Reels" : "videos"}{" "}
                found
              </h3>

              <p>
                Try another search or upload something new.
              </p>

              <Link
                className="primary-button"
                to="/upload"
              >
                Upload content
              </Link>
            </section>
          ) : (
            <div className="video-grid">
              {filteredVideos.map((video) => (
                <Link
                  className="content-card"
                  to={`/watch/${video._id}`}
                  key={video._id}
                >
                  <div className="card-thumbnail">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        loading="lazy"
                      />
                    ) : (
                      <div className="card-placeholder">
                        <span>
                          {video.type === "reel"
                            ? "REEL"
                            : "▶"}
                        </span>
                      </div>
                    )}

                    {video.type === "reel" && (
                      <span className="type-badge">
                        REEL
                      </span>
                    )}
                  </div>

                  <div className="card-copy">
                    <h3>
                      {video.title || "Untitled video"}
                    </h3>

                    <p>
                      @{video.creator?.username || "creator"}
                    </p>

                    <span className="muted">
                      {video.views || 0} views
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </section>
    </main>
  );
}