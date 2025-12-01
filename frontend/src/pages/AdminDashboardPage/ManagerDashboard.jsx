import React, { useEffect, useState } from "react";
import api from "../apiClient";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./ManagerDashboard.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#22c55e", "#f97373", "#38bdf8"]; // present / absent / leave

function ManagerDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    leaveCount: 0,
    date: new Date(),
  });
  const [rows, setRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(true);

  const [analytics, setAnalytics] = useState({
    dailyData: [],
    statusSummary: { present: 0, absent: 0, leave: 0 },
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchDailyDashboard = async (dateStr) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (e) {
      console.error("Invalid token", e);
      navigate("/login");
      return;
    }

    if (decoded.role !== "admin") {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(
        "/api/manager/attendance",
        {
          params: { date: dateStr },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStats({
        totalEmployees: data.totalEmployees,
        presentCount: data.presentCount,
        absentCount: data.absentCount,
        leaveCount: data.leaveCount,
        date: data.date,
      });
      setRows(data.rows);
    } catch (err) {
      console.error("Error fetching manager data:", err);
      alert("Failed to load manager dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAnalytics = async (dateStr) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch {
        return;
      }
      if (decoded.role !== "admin") return;

      const m = moment(dateStr, "YYYY-MM-DD");
      const year = m.format("YYYY");
      const month = m.format("MM");

      setAnalyticsLoading(true);
      const { data } = await api.get(
        "/api/manager/analytics/monthly",
        {
          params: { year, month },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnalytics({
        dailyData: data.dailyData || [],
        statusSummary: data.statusSummary || {
          present: 0,
          absent: 0,
          leave: 0,
        },
      });
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyDashboard(selectedDate);
    fetchMonthlyAnalytics(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const pieData = [
    { name: "Present", value: analytics.statusSummary.present || 0 },
    { name: "Absent", value: analytics.statusSummary.absent || 0 },
    { name: "Leave", value: analytics.statusSummary.leave || 0 },
  ];

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Manager Dashboard</h2>
          <p className="manager-subtitle">
            Daily and monthly overview of employee attendance
          </p>
        </div>

        <div className="manager-date-picker">
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Top stats cards */}
      <div className="manager-cards">
        <div className="manager-card">
          <span className="card-label">Total Employees</span>
          <h3 className="card-value">{stats.totalEmployees}</h3>
        </div>
        <div className="manager-card present">
          <span className="card-label">Present Today</span>
          <h3 className="card-value">{stats.presentCount}</h3>
        </div>
        <div className="manager-card absent">
          <span className="card-label">Absent / No Record</span>
          <h3 className="card-value">{stats.absentCount}</h3>
        </div>
        <div className="manager-card leave">
          <span className="card-label">On Leave Today</span>
          <h3 className="card-value">{stats.leaveCount}</h3>
        </div>
      </div>

      {/* Charts row */}
      <div className="manager-charts">
        <div className="chart-card">
          <h3>Monthly Present Count (Per Day)</h3>
          {analyticsLoading ? (
            <p>Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.dailyData}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="present" barSize={16} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Monthly Status Distribution</h3>
          {analyticsLoading ? (
            <p>Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {pieData.map((entry, index) => (
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
          )}
        </div>
      </div>

      {/* Table for selected day */}
      <div className="manager-table-card">
        <h3 className="manager-table-title">Employees – Daily Attendance</h3>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="manager-table-wrapper">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="7">No employees found.</td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.userId || row._id || index}>
                      <td>{index + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.status}</td>
                      <td>
                        {row.checkInTime
                          ? moment(row.checkInTime).format("hh:mm A")
                          : "-"}
                      </td>
                      <td>
                        {row.checkOutTime
                          ? moment(row.checkOutTime).format("hh:mm A")
                          : "-"}
                      </td>
                      <td>
                        {row.totalHours
                          ? row.totalHours.toFixed(2)
                          : row.status === "Present"
                          ? "—"
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;
