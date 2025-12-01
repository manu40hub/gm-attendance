import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/user/profile", // ✅ CORRECT ENDPOINT
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(data);
      setName(data.name || "");
    } catch (err) {
      console.error("Error fetching profile:", err.response?.data || err);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setSaving(true);
      await axios.put(
        "http://localhost:5000/api/user/profile",
        { name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Profile updated!");
      fetchProfile();
    } catch (err) {
      console.error("Error updating profile:", err.response?.data || err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <p>Could not load profile.</p>
      </div>
    );
  }

  const avatarName = encodeURIComponent(user.name || "User");

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <img
            src={`https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff&rounded=true&size=128`}
            alt="avatar"
          />
        </div>

        <h2>{user.name}</h2>
        <p className="role">
          {user.role === "admin" ? "Manager" : "Employee"}
        </p>
        <p className="email">{user.email}</p>

        <form className="profile-form" onSubmit={handleSave}>
          <label>Update Name</label>
          <input
            type="text"
            value={name}
            className="input"
            onChange={(e) => setName(e.target.value)}
          />

          <button className="save-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
