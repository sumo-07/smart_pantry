import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to authenticate with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <section className="view" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 100px)" }}>
      <div className="mod" style={{ width: "100%", maxWidth: "440px", display: "grid", gap: "18px" }}>
        <div>
          <span className="lab">SYSTEM ACCESS</span>
          <h1 className="sp-h1" style={{ fontSize: "38px", marginTop: "6px" }}>
            Sign in
          </h1>
          <p className="lab" style={{ marginTop: "8px", fontWeight: 500 }}>
            Log in to access your Smart Pantry AI telemetry.
          </p>
        </div>

        {errorMsg && (
          <div className="lcd" style={{ borderColor: "var(--r)", fontSize: "14px" }}>
            ERROR: {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span className="lab">EMAIL</span>
            <input
              type="email"
              required
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label style={{ display: "grid", gap: "6px" }}>
            <span className="lab">PASSWORD</span>
            <input
              type="password"
              required
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="key pri" disabled={loading} style={{ width: "100%", marginTop: "6px" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="key"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{ width: "100%" }}
        >
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="lab" style={{ textAlign: "center" }}>
          New here?{" "}
          <Link to="/register" style={{ color: "var(--blue)", textDecoration: "none" }}>
            Create an account
          </Link>
        </div>
      </div>
    </section>
  );
}
