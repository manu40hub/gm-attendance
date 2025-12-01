import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManagerLeaves.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import moment from "moment";

function ManagerLeaves() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const fetchPending = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") {
        navigate("/");
        return;
      }

      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/leave/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPendingLeaves(data);
    } catch (err) {
      console.error("Fetch pending leaves error:", err);
      alert("Failed to load pending leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDecision = async (id, action) => {
    if (!window.confirm(`Are you sure to ${action} this leave?`)) return;

    try {
      const url = `http://localhost:5000/api/leave/${id}/${action}`;
      await axios.put(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`Leave ${action}ed`);
      fetchPending();
    } catch (err) {
      console.error(`Leave ${action} error:`, err.response?.data || err);
      alert(`Failed to ${action} leave`);
    }
  };

  return (
    <div className="manager-leaves-container">
      <h2>Pending Leave Requests</h2>

      {loading ? (
        <p>Loading...</p>
      ) : pendingLeaves.length === 0 ? (
        <p>No pending leave requests.</p>
      ) : (
        <div className="manager-leaves-card">
          <table className="manager-leaves-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map((l) => (
                <tr key={l._id}>
                  <td>{l.user?.name}</td>
                  <td>{l.user?.email}</td>
                  <td>{moment(l.startDate).format("YYYY-MM-DD")}</td>
                  <td>{moment(l.endDate).format("YYYY-MM-DD")}</td>
                  <td>{l.type}</td>
                  <td>{l.reason}</td>
                  <td>
                    <button
                      className="btn-approve"
                      onClick={() => handleDecision(l._id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleDecision(l._id, "reject")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagerLeaves;
