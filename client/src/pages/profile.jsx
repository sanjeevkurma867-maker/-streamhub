import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { FiEye, FiHeart, FiPlay } from "react-icons/fi";

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/users/${id}`);

        if (!active) return;

        const data = response.data;
        setProfile(data.user || data);
        setVideos(data.videos || data.user?.videos || []);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load this profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="loading-screen">Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <main className="page-container">
        <p className="error-message">{error || "Profile not found."}</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </main>
    );
  }

  const username = profile.username || "StreamHub User";
  const videoCount = videos.filter((video) => video.type !== "reel").length;
  const reelCount = videos.filter((video) => video.type === "reel").length;

  return (
    <main className="page-container profile-page">
      <section className="profile-header">
        <div className="profile-avatar">
          {username.charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <h1>{username}</h1>
          <p>{profile.bio || "Welcome to my StreamHub profile."}</p>

          <div className="profile-stats">
            <span>
              <strong>{videos.length}</strong> Posts
            </span>
            <span>
              <strong>{videoCount}</strong> Videos
            </span>
            <span>
              <strong>{reelCount}</strong> Reels
            </span>
          </div>
        </div>
      </section>

      <section className="profile-content">
        <h2>Videos & Reels</h2>

        {videos.length === 0 ? (
          <div className="empty-state">
            <FiPlay size={32} />
            <p>This creator hasn't uploaded anything yet.</p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <Link
                to={`/watch/${video._id}`}
                className="video-card"
                key={video._id}
              >
                <div className="video-thumbnail">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <FiPlay size={32} />
                    </div>
                  )}

                  {video.type === "reel" && (
                    <span className="video-type-badge">REEL</span>
                  )}
                </div>

                <div className="video-card-info">
                  <h3>{video.title || "Untitled video"}</h3>

                  <div className="video-card-meta">
                    <span>
                      <FiEye /> {video.views || 0}
                    </span>
                    <span>
                      <FiHeart /> {video.likes?.length || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}