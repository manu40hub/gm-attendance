import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./ManagerEmployeeAttendance.css";

function ManagerEmployeeAttendance() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [year, setYear] = useState(moment().format("YYYY"));
  const [month, setMonth] = useState(moment().format("MM"));
  const [loading, setLoading] = useState(true);
    const [manualDate, setManualDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [manualStatus, setManualStatus] = useState("Present");


  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch {
        navigate("/login");
        return;
      }

      if (decoded.role !== "admin") {
        navigate("/");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/manager/attendance/export/${userId}`,
        {
          params: { year, month },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob", // important for file downloads
        }
      );

      // Create a blob link and trigger download
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const safeName = (summary.userName || "employee").replace(
        /[^a-z0-9]+/gi,
        "_"
      );

      link.href = url;
      link.download = `attendance_${safeName}_${year}-${month}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
      alert("Failed to export CSV");
    }
  };

    const handleManualUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch {
        navigate("/login");
        return;
      }

      if (decoded.role !== "admin") {
        navigate("/");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/manager/attendance/manual",
        {
          userId,
          date: manualDate,
          status: manualStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Attendance updated.");
      // Refresh current month summary + details
      fetchAttendance();
    } catch (err) {
      console.error("Manual update failed:", err);
      alert("Failed to update attendance");
    }
  };



  const fetchAttendance = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      return navigate("/login");
    }

    if (decoded.role !== "admin") return navigate("/");

    try {
      setLoading(true);

      // Summary
      const summaryRes = await axios.get(
        `http://localhost:5000/api/attendance/summary/${userId}`,
        { params: { year, month } }
      );

      // Daily details
      const detailsRes = await axios.get(
        `http://localhost:5000/api/attendance/details/${userId}`,
        { params: { year, month } }
      );

      setSummary(summaryRes.data);
      setAttendance(detailsRes.data);
    } catch (err) {
      console.error(err);
      alert("Unable to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line
  }, [year, month]);

  const getAllDays = () => {
    const count = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
    return [...Array(count)].map((_, i) => {
      const date = moment(`${year}-${month}-${i + 1}`).format("YYYY-MM-DD");
      const rec = attendance.find(
        (d) => moment(d.date).format("YYYY-MM-DD") === date
      );
      return {
        date,
        status: rec ? rec.status : "No Record",
      };
    });
  };

  return (
    <div className="manager-attendance-container">
      <div className="manager-attendance-header">
        <div>
          <h2>Employee Attendance</h2>
          <p className="subtitle">
            Monthly attendance for <strong>{summary.userName}</strong>
          </p>
        </div>

        <button className="export-btn" onClick={handleExportCsv}>
          Export CSV
        </button>
      </div>
      <div className="filters">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          {[2023, 2024, 2025].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {moment.months().map((m, idx) => (
            <option key={m} value={String(idx + 1).padStart(2, "0")}>
              {m}
            </option>
          ))}
        </select>
      </div>

            <form className="manual-update" onSubmit={handleManualUpdate}>
        <div className="manual-field">
          <label>Date</label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
          />
        </div>

        <div className="manual-field">
          <label>Status</label>
          <select
            value={manualStatus}
            onChange={(e) => setManualStatus(e.target.value)}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
        </div>

        <button type="submit" className="manual-save-btn">
          Save Attendance
        </button>
      </form>


      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="summary-card">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Leave</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{summary.userName}</td>
                  <td>{summary.userEmail}</td>
                  <td>{summary.presentDays || 0}</td>
                  <td>{summary.absentDays || 0}</td>
                  <td>{summary.leaveDays || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="daily-card">
            <h3>Daily Attendance</h3>
            <div className="daily-table-wrapper">
              <table className="daily-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllDays().map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ManagerEmployeeAttendance;
