import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import api from "../api";
import { useAuth } from "../context/authcontext";
import { FiRadio, FiArrowLeft, FiVideoOff } from "react-icons/fi";

export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stream, setStream] = useState(null);
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    let active = true;

    async function initializeStream() {
      try {
        const response = await api.get(`/live/${id}`);
        const streamData = response.data.stream || response.data;

        if (!active) return;

        setStream(streamData);

        if (streamData.status === "ended") {
          setError("This live stream has ended.");
          return;
        }

        const hostId =
          typeof streamData.host === "object"
            ? streamData.host?._id
            : streamData.host;

        const currentUserId = user?._id || user?.id;

        const hosting =
          Boolean(currentUserId) &&
          String(hostId) === String(currentUserId);

        setIsHost(hosting);

        const tokenResponse = await api.post(`/live/${id}/token`, {
          role: hosting ? "host" : "viewer",
        });

        if (!active) return;

        const tokenData = tokenResponse.data;

        if (tokenData.token && tokenData.serverUrl) {
          setToken(tokenData.token);
          setServerUrl(tokenData.serverUrl);
        } else {
          setError("Live video is not configured on the server.");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to connect to this live stream."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeStream();

    return () => {
      active = false;
    };
  }, [id, user?._id, user?.id]);

  async function endStream() {
    if (!isHost || ending) return;

    const confirmed = window.confirm(
      "Are you sure you want to end this live stream?"
    );

    if (!confirmed) return;

    setEnding(true);

    try {
      await api.post(`/live/${id}/end`);
      navigate("/live");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to end the live stream."
      );
      setEnding(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        Connecting to live stream...
      </div>
    );
  }

  return (
    <main className="page-container live-room-page">
      <div className="page-heading">
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/live")}
          >
            <FiArrowLeft /> Back to Live
          </button>

          <h1>
            <FiRadio /> {stream?.title || "Live Stream"}
          </h1>

          <p>
            Hosted by{" "}
            {stream?.host?.username ||
              stream?.hostUsername ||
              "StreamHub Creator"}
          </p>
        </div>

        {isHost && (
          <button
            type="button"
            className="btn-danger"
            onClick={endStream}
            disabled={ending}
          >
            {ending ? "Ending..." : "End Stream"}
          </button>
        )}
      </div>

      {error && (
        <div className="empty-state">
          <FiVideoOff size={40} />
          <h2>Live video unavailable</h2>
          <p>{error}</p>
        </div>
      )}

      {!error && token && serverUrl && (
        <div
          className="live-video-container"
          style={{
            height: "75vh",
            minHeight: "450px",
            background: "#111",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <LiveKitRoom
            video={isHost}
            audio={isHost}
            token={token}
            serverUrl={serverUrl}
            connect={true}
            data-lk-theme="default"
            style={{ height: "100%" }}
            onDisconnected={() => {
              if (!isHost) {
                navigate("/live");
              }
            }}
            onError={(err) => {
              setError(err.message || "Live connection failed.");
            }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      )}

      {stream?.description && (
        <section className="live-description">
          <h2>About this stream</h2>
          <p>{stream.description}</p>
        </section>
      )}
    </main>
  );
}