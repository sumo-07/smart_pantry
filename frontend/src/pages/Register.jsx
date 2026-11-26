import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PASSWORD_RULES = [
  { id: "length", label: "8+ characters", test: (pw) => pw.length >= 8 },
  { id: "upper", label: "1 uppercase (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "1 lowercase (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { id: "numOrSym", label: "1 number or symbol", test: (pw) => /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw) },
];

const AUTH_ERROR_MESSAGES = {
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number or symbol.",
  "auth/operation-not-allowed": "Email/password signup is currently disabled.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
};

function getAuthErrorMessage(err, fallback) {
  return AUTH_ERROR_MESSAGES[err?.code] || err?.message || fallback;
}

export default function Register() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const ruleResults = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
  const isPasswordStrong = ruleResults.every((rule) => rule.passed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address (e.g. you@example.com).");
      return;
    }

    if (!password || !password.trim()) {
      setErrorMsg("Password cannot be blank or spaces only.");
      return;
    }

    if (!isPasswordStrong) {
      setErrorMsg("Password must be at least 8 characters and include uppercase, lowercase, and a number or symbol.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await signup(trimmedEmail, password);
      navigate("/scan");
    } catch (err) {
      console.error(err);
      setErrorMsg(getAuthErrorMessage(err, "Failed to create account. Email may already be registered."));
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
      setErrorMsg(getAuthErrorMessage(err, "Failed to authenticate with Google."));
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

        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "12px" }}>
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
              placeholder="Minimum 8 characters"
            />
          </label>

          {password.length > 0 && (
            <div style={{ display: "grid", gap: "6px", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "4px 10px" }}>
                {ruleResults.map((rule) => (
                  <span
                    key={rule.id}
                    className="lab"
                    style={{
                      fontSize: "11px",
                      color: rule.passed ? "var(--g)" : "var(--ink-3)",
                      fontWeight: rule.passed ? 600 : 500,
                    }}
                  >
                    {rule.passed ? "✓" : "•"} {rule.label}
                  </span>
                ))}
              </div>
              {isPasswordStrong && (
                <div className="lab" style={{ fontSize: "12px", color: "var(--g)", fontWeight: 600, marginTop: "2px" }}>
                  ✓ Your password is good — now you can create your account and log in.
                </div>
              )}
            </div>
          )}

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
            {confirmPassword.length > 0 && (
              <span
                className="lab"
                style={{
                  fontSize: "11px",
                  color: password === confirmPassword ? "var(--g)" : "var(--r)",
                  fontWeight: 600,
                }}
              >
                {password === confirmPassword ? "✓ Passwords match" : "Passwords do not match"}
              </span>
            )}
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
