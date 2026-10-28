import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setBusy(true);
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Check your email and password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell narrow-page">
      <section className="form-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Log in to StreamHub</h1>
        <p className="muted">Pick up where you left off.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button"
            type="submit"
            disabled={busy}
          >
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="form-footer">
          New to StreamHub? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}