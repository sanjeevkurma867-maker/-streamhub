import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authcontext.jsx";
import Navbar from "./components/navbar.jsx";
import ProtectedRoute from "./components/protectedroute.jsx";
import Home from "./pages/home.jsx";
import Reels from "./pages/reels.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Upload from "./pages/upload.jsx";
import Profile from "./pages/profile.jsx";
import Watch from "./pages/watch.jsx";
import LiveList from "./pages/livelist.jsx";
import GoLive from "./pages/golive.jsx";
import LiveRoom from "./pages/liveroom.jsx";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/live" element={<LiveList />} />
          <Route path="/live/:id" element={<LiveRoom />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/upload" element={<Upload />} />
            <Route path="/live/new" element={<GoLive />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}