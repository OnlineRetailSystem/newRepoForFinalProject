import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../AdminLogin/AdminLogin.css";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [pwView, setPwView] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("http://localhost:8081/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pw })
      });

      if (res.ok) {
        const data = await res.json();
        // Store admin credentials in localStorage
        localStorage.setItem("adminUsername", data.username);
        localStorage.setItem("adminEmail", data.email);
        localStorage.setItem("isAdmin", "true");
        setError("");
        navigate("/admindashboard");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Incorrect admin credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-bg">
      <form className="admin-login-card" onSubmit={handleLogin} autoComplete="off">
        <div className="admin-login-title">Login</div>
        <input
          className="admin-login-input"
          placeholder="Username"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
        />
        <div className="admin-login-pw-wrap">
          <input
            className="admin-login-input"
            placeholder="Password"
            type={pwView ? "text" : "password"}
            value={pw}
            onChange={e => setPw(e.target.value)}
          />
          <button
            className="admin-login-eye"
            type="button"
            tabIndex={-1}
            onClick={() => setPwView(v => !v)}
            aria-label={pwView ? "Hide password" : "Show password"}
          >
            {pwView ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <button className="admin-login-btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div className="admin-login-error">{error}</div>}
        <div className="admin-login-support">
          <div>Need help?</div>
          <div>Contact support for assistance.</div>
        </div>
      </form>
    </div>
  );
}