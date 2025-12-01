import React, { useState } from "react";
import api from "../../apiClient";
import { useNavigate, Link } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { MdOutlineAlternateEmail } from "react-icons/md";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const { data } = await api.post(
        "/api/auth/login",
        { email, password }
      );
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (error) {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        <p className="auth-subtitle">
          Welcome back! Please enter your details.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrapper">
              <MdOutlineAlternateEmail className="auth-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <FaLock className="auth-input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-row">
            <label className="auth-checkbox">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="auth-footer-text">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="auth-link-strong">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
