import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ familySize }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("sp_theme") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem("sp_theme", theme);
      } catch {
        // ignore storage errors
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const isCurrentlyDark = theme
      ? theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isCurrentlyDark ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const isActive = (path) => location.pathname === path;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Demo User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="sp-header">
      <Link to="/" className="brand">
        Smart Pantry AI <small>MODEL 01</small>
      </Link>

      {user && (
        <nav className="sp-nav" aria-label="Main">
          <Link to="/" className={`key nav${isActive("/") ? " on" : ""}`}>
            Home
          </Link>
          <Link to="/dashboard" className={`key nav${isActive("/dashboard") ? " on" : ""}`}>
            Dashboard
          </Link>
          <Link to="/scan" className={`key nav${isActive("/scan") ? " on" : ""}`}>
            Pantry scanner
          </Link>
          <Link to="/shopping-list" className={`key nav${isActive("/shopping-list") ? " on" : ""}`}>
            Shopping list
          </Link>
          <Link to="/insights" className={`key nav${isActive("/insights") ? " on" : ""}`}>
            AI insights
          </Link>
        </nav>
      )}

      <button
        type="button"
        className="key sm"
        onClick={toggleTheme}
        aria-label="Toggle light and dark mode"
      >
        Theme
      </button>

      {user ? (
        <div className="user">
          <div className="av" aria-hidden="true">
            {avatarLetter}
          </div>
          <div>
            <b>{displayName}</b>
            <span className="lab">Family of {familySize || 4}</span>
          </div>
          <button type="button" className="key sm" onClick={handleLogout} title="Sign out">
            Logout
          </button>
        </div>
      ) : (
        <Link to="/login" className="key sm pri">
          Sign in
        </Link>
      )}
    </header>
  );
}
