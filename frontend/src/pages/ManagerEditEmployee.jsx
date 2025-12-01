import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManagerEditEmployee.css";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ManagerEditEmployee() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    password: "",
  });

  const [loading, setLoading] = useState(true);

  const fetchEmployee = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") return navigate("/");

      const { data } = await axios.get(
        `http://localhost:5000/api/manager/employees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const emp = data.find((u) => u._id === userId);
      if (!emp) return navigate("/manager/employees");

      setForm({
        name: emp.name,
        email: emp.email,
        role: emp.role,
        password: "",
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to load employee");
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/manager/employee/update/${userId}`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Employee updated successfully!");
      navigate("/manager/employees");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <div className="edit-container">
      <h2>Edit Employee</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form className="edit-card" onSubmit={handleSave}>
          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="employee">Employee</option>
            <option value="admin">Manager</option>
          </select>

          <label>Reset Password (optional)</label>
          <input
            type="password"
            placeholder="Enter new password or leave empty"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button type="submit" className="save-btn">
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
}

export default ManagerEditEmployee;
