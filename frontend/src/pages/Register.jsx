import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await signup(email, password);
      navigate("/scan");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create account. Email may already be registered.");
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
          <span className="lab">NEW HOUSEHOLD</span>
          <h1 className="sp-h1" style={{ fontSize: "38px", marginTop: "6px" }}>
            Create account
          </h1>
          <p className="lab" style={{ marginTop: "8px", fontWeight: 500 }}>
            Start tracking your pantry with Gemini Vision.
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
              placeholder="Minimum 6 characters"
            />
          </label>

          <label style={{ display: "grid", gap: "6px" }}>
            <span className="lab">CONFIRM PASSWORD</span>
            <input
              type="password"
              required
              className="field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
            />
          </label>

          <button type="submit" className="key pri" disabled={loading} style={{ width: "100%", marginTop: "6px" }}>
            {loading ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--blue)", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
