import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Leave.css";
import { useNavigate } from "react-router-dom";
import moment from "moment";

function Leave() {
  const [startDate, setStartDate] = useState(moment().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [type, setType] = useState("Sick");
  const [reason, setReason] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const fetchMyLeaves = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/leave/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(data);
    } catch (err) {
      console.error("Fetch leaves error:", err);
      alert("Failed to load leave history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        "http://localhost:5000/api/leave/apply",
        {
          startDate,
          endDate,
          type,
          reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Leave request submitted");
      setReason("");
      fetchMyLeaves();
    } catch (err) {
      console.error("Apply leave error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message ||
          "Failed to submit leave request. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="leave-container">
      <div className="leave-form-card">
        <h2>Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="leave-form">
          <div className="leave-row">
            <div className="leave-field">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="leave-field">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="leave-row">
            <div className="leave-field">
              <label>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="leave-field">
            <label>Reason</label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="leave-submit-btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </div>

      <div className="leave-history-card">
        <h3>My Leave History</h3>
        {loading ? (
          <p>Loading...</p>
        ) : leaves.length === 0 ? (
          <p>No leave records found.</p>
        ) : (
          <div className="leave-table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Applied On</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>{moment(l.createdAt).format("YYYY-MM-DD")}</td>
                    <td>{moment(l.startDate).format("YYYY-MM-DD")}</td>
                    <td>{moment(l.endDate).format("YYYY-MM-DD")}</td>
                    <td>{l.type}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leave;
