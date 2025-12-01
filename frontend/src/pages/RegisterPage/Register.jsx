import React, { useState } from "react";
import api from "../apiClient";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { MdOutlineAlternateEmail } from "react-icons/md";
import "./Register.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      });
      alert("Registration Successful!");
      navigate("/login");
    } catch (error) {
      alert(
        "Registration Failed: " + (error.response?.data?.message || "Try again")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>
        <p className="auth-subtitle">
          Create your account to access the portal.
        </p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label>Name</label>
            <div className="auth-input-wrapper">
              <FaUser className="auth-input-icon" />
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrapper">
              <MdOutlineAlternateEmail className="auth-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-select"
            >
              <option value="employee">Employee</option>
              <option value="admin">Manager</option>
            </select>
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link-strong">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
