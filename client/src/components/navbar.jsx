import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <nav className="navbar page-shell">
        <Link className="brand" to="/">
          <span className="brand-mark">S</span>
          <span>StreamHub</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/reels">
            Reels
          </NavLink>

          <NavLink to="/live">
            Live
          </NavLink>

          {user && <NavLink to="/upload">Upload</NavLink>}
        </div>

        <div className="nav-account">
          {user ? (
            <>
              <Link
                className="profile-link"
                to={`/profile/${user._id}`}
              >
                @{user.username}
              </Link>

              <button
                className="nav-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">
                Log in
              </Link>

              <Link
                className="primary-button nav-signup"
                to="/register"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}