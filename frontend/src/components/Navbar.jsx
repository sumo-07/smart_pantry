import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ familySize }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isCurrentlyDark = theme
    ? theme === "dark"
    : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const toggleTheme = () => {
    setTheme(isCurrentlyDark ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      setMenuOpen(false);
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const isActive = (path) => location.pathname === path;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Demo User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/scan", label: "Pantry scanner" },
    { to: "/shopping-list", label: "Shopping list" },
    { to: "/insights", label: "AI insights" }
  ];

  return (
    <header className="sp-header">
      <Link to="/" className="brand">
        Smart Pantry AI <small>MODEL 01</small>
      </Link>

      {/* Desktop Navigation */}
      {user && (
        <nav className="sp-nav desktop-nav" aria-label="Main">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`key nav${isActive(item.to) ? " on" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          className="key"
          onClick={toggleTheme}
          aria-label="Toggle light and dark mode"
          title={isCurrentlyDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{ padding: "10px 12px", height: "41px" }}
        >
          {isCurrentlyDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {user ? (
          <>
            <div className="user">
              <div className="av" aria-hidden="true">
                {avatarLetter}
              </div>
              <div>
                <b>{displayName}</b>
                <span className="lab">Family of {familySize || 4}</span>
              </div>
              <button
                type="button"
                className="key sm desktop-only"
                onClick={handleLogout}
                title="Sign out"
              >
                Logout
              </button>
            </div>

            {/* Hamburger toggle on small/medium screens */}
            <button
              type="button"
              className={`key sm mobile-menu-btn${menuOpen ? " on" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </>
        ) : (
          <Link to="/login" className="key sm pri">
            Sign in
          </Link>
        )}
      </div>

      {/* Mobile Dropdown Drawer */}
      {user && menuOpen && (
        <div className="mod mobile-drawer" role="dialog" aria-label="Mobile navigation">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "2px solid var(--off)" }}>
            <div>
              <b style={{ fontSize: "14px" }}>{displayName}</b>
              <div className="lab">Family of {familySize || 4}</div>
            </div>
            <button type="button" className="key sm del" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <nav className="mobile-nav-list" aria-label="Mobile">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`key nav${isActive(item.to) ? " on" : ""}`}
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
