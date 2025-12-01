import React, { useEffect, useState } from "react";
import api from "../apiClient";
import "./ManagerDailyAttendance.css";
import moment from "moment";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function ManagerDailyAttendance() {
  const navigate = useNavigate();
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDailyData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") return navigate("/");

      setLoading(true);
      const { data } = await api.get(
        "/api/manager/daily",
        {
          params: { date },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRecords(data);
    } catch (err) {
      console.error("Daily fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, [date]);

  return (
    <div className="daily-container">
      <h2>Daily Attendance</h2>

      <div className="daily-filter">
        <label>Select Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="daily-card">
          <table className="daily-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.status}</td>
                  <td>
                    {emp.checkInTime
                      ? moment(emp.checkInTime).format("HH:mm")
                      : "-"}
                  </td>
                  <td>
                    {emp.checkOutTime
                      ? moment(emp.checkOutTime).format("HH:mm")
                      : "-"}
                  </td>
                  <td>{emp.totalHours || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagerDailyAttendance;
