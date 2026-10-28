import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("streamhub_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const token = localStorage.getItem("streamhub_token");

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data.user || response.data;

        if (active) {
          setUser(currentUser);
          localStorage.setItem("streamhub_user", JSON.stringify(currentUser));
        }
      } catch {
        localStorage.removeItem("streamhub_token");
        localStorage.removeItem("streamhub_user");

        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;

    if (!data.token || !data.user) {
      throw new Error("Login response did not include a token and user.");
    }

    localStorage.setItem("streamhub_token", data.token);
    localStorage.setItem("streamhub_user", JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  }

  async function register(username, email, password) {
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
    });

    const data = response.data;

    if (data.token && data.user) {
      localStorage.setItem("streamhub_token", data.token);
      localStorage.setItem("streamhub_user", JSON.stringify(data.user));

      setUser(data.user);
      return data.user;
    }

    return login(email, password);
  }

  function logout() {
    localStorage.removeItem("streamhub_token");
    localStorage.removeItem("streamhub_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}