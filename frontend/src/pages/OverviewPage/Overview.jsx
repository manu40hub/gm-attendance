import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import "./Overview.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const PIE_COLORS = ["#22c55e", "#f97373", "#38bdf8"]; // Present / Absent / Leave

function Overview() {
  const [summary, setSummary] = useState({});
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MM"));
  const [selectedYear, setSelectedYear] = useState(moment().format("YYYY"));
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const navigate = useNavigate();

  // ------- Fetch summary & daily data -------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAttendanceSummary = (userId) => {
      setLoading(true);
      api
        .get(`/api/attendance/summary/${userId}`, {
          params: { year: selectedYear, month: selectedMonth },
        })
        .then(({ data }) => {
          setSummary(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching attendance summary:", err);
          alert("Failed to fetch attendance data. Please try again later.");
          setLoading(false);
        });
    };

    const fetchDailyAttendance = (userId) => {
      setLoading(true);
      api
        .get(`/api/attendance/details/${userId}`, {
          params: { year: selectedYear, month: selectedMonth },
        })
        .then(({ data }) => {
          setAttendanceDetails(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(
            "Error fetching daily attendance:",
            err.response?.data || err.message
          );
          setLoading(false);
        });
    };

    const fetchToday = () => {
      api
        .get("/api/attendance/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(({ data }) => setTodayAttendance(data.attendance || null))
        .catch((err) => {
          console.error("Error fetching today's attendance:", err);
        });
    };

    try {
      const userId = jwtDecode(token).id;
      fetchAttendanceSummary(userId);
      fetchDailyAttendance(userId);
      fetchToday();
    } catch (err) {
      console.error("Invalid token:", err);
      navigate("/login");
    }
  }, [selectedMonth, selectedYear, navigate]);

  // ------- Check-in / Check-out -------
  const handleCheckIn = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setBtnLoading(true);
      const { data } = await api.post(
        "/api/attendance/checkin",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(data.message);
      setTodayAttendance(data.attendance);
    } catch (err) {
      console.error("Check-in error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message || "Failed to check in. Please try again."
      );
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setBtnLoading(true);
      const { data } = await api.post(
        "/api/attendance/checkout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(data.message);
      setTodayAttendance(data.attendance);
    } catch (err) {
      console.error("Check-out error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message || "Failed to check out. Please try again."
      );
    } finally {
      setBtnLoading(false);
    }
  };

  // ------- Utilities -------
  const getAllDaysOfMonth = () => {
    const daysInMonth = moment(
      `${selectedYear}-${selectedMonth}`,
      "YYYY-MM"
    ).daysInMonth();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = moment(
        `${selectedYear}-${selectedMonth}-${index + 1}`,
        "YYYY-MM-DD"
      ).format("YYYY-MM-DD");

      const record = attendanceDetails.find(
        (att) => moment(att.date).format("YYYY-MM-DD") === date
      );

      return { date, status: record ? record.status : "No Record" };
    });
  };

  const monthStatusChartData = [
    { name: "Present", value: summary.presentDays || 0 },
    { name: "Absent", value: summary.absentDays || 0 },
    { name: "Leave", value: summary.leaveDays || 0 },
  ];

  const todayStatusText = todayAttendance
    ? todayAttendance.status
    : "No Record";

  return (
    <div className="overview-container">
      {/* Today card with check-in / check-out */}
      <div className="today-card">
        <h2>Today&apos;s Attendance</h2>
        <p>
          <strong>Date:</strong> {moment().format("YYYY-MM-DD")}
        </p>
        <p>
          <strong>Status:</strong> {todayStatusText}
        </p>
        {todayAttendance?.checkInTime && (
          <p>
            <strong>Check-In:</strong>{" "}
            {moment(todayAttendance.checkInTime).format("hh:mm A")}
          </p>
        )}
        {todayAttendance?.checkOutTime && (
          <p>
            <strong>Check-Out:</strong>{" "}
            {moment(todayAttendance.checkOutTime).format("hh:mm A")}
          </p>
        )}

        <div style={{ marginTop: "8px", display: "flex", gap: "10px" }}>
          <button
            className="btn-primary"
            type="button"
            onClick={handleCheckIn}
            disabled={btnLoading || todayAttendance?.checkInTime}
          >
            {todayAttendance?.checkInTime ? "Checked In" : "Check In"}
          </button>

          <button
            className="btn-primary"
            type="button"
            onClick={handleCheckOut}
            disabled={
              btnLoading ||
              !todayAttendance?.checkInTime ||
              !!todayAttendance?.checkOutTime
            }
          >
            {todayAttendance?.checkOutTime ? "Checked Out" : "Check Out"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-container">
        <label>Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="input-select"
        >
          {[2023, 2024, 2025].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <label>Month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input-select"
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <option key={index} value={String(index + 1).padStart(2, "0")}>
              {moment().month(index).format("MMMM")}
            </option>
          ))}
        </select>
      </div>

      {/* Chart + Summary row */}
      <div className="overview-top-row">
        {/* Summary table */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Month</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Leave Days</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{summary.userName}</td>
                <td>{summary.userEmail}</td>
                <td>{selectedYear}</td>
                <td>{moment(selectedMonth, "MM").format("MMMM")}</td>
                <td>{summary.presentDays || 0}</td>
                <td>{summary.absentDays || 0}</td>
                <td>{summary.leaveDays || 0}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Monthly status pie chart */}
        <div className="overview-chart-card">
          <h3>Monthly Status Overview</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={monthStatusChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {monthStatusChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily details table */}
      <div className="attendance-table-container">
        <div className="scrollable-table">
          <table className="attendance-detail-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {getAllDaysOfMonth().map((record, index) => (
                <tr key={index}>
                  <td>{moment(record.date).format("YYYY-MM-DD")}</td>
                  <td>{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Overview;
