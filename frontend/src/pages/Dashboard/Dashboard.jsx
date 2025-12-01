import React, { useEffect, useState } from "react";
import api from "../apiClient";
import moment from "moment";
import { jwtDecode } from "jwt-decode";
import "./Dashboard.css";

function Dashboard() {
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const userId = jwtDecode(token).id;
  const thisYear = moment().format("YYYY");
  const thisMonth = moment().format("MM");

  useEffect(() => {
    fetchToday();
    fetchSummary();
  }, []);

  const fetchToday = () => {
    api
      .get("/api/attendance/today", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setToday(res.data.attendance))
      .catch(() => setError("Failed loading today's data"));
  };

  const fetchSummary = () => {
    api
      .get(`/api/attendance/summary/${userId}`, {
        params: { year: thisYear, month: thisMonth },
      })
      .then((res) => {
        setSummary(res.data);
        setLoading(false);
      });
  };

  const checkIn = () => {
    setActionLoading(true);
    api
      .post(
        "/api/attendance/checkin",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        fetchToday();
        fetchSummary();
      })
      .finally(() => setActionLoading(false));
  };

  const checkOut = () => {
    setActionLoading(true);
    api
      .post(
        "/api/attendance/checkout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        fetchToday();
        fetchSummary();
      })
      .finally(() => setActionLoading(false));
  };

  return (
    <div className="dash-container">
      <h1>Employee Dashboard</h1>

      <div className="dash-today-card">
        <h3>Today's Attendance</h3>

        {today ? (
          today.checkOutTime ? (
            <>
              <p>Checked in: {moment(today.checkInTime).format("hh:mm A")}</p>
              <p>Checked out: {moment(today.checkOutTime).format("hh:mm A")}</p>
              <p>Total Hours: {today.totalHours}</p>
            </>
          ) : (
            <>
              <p>Checked in: {moment(today.checkInTime).format("hh:mm A")}</p>
              <button disabled={actionLoading} onClick={checkOut}>
                {actionLoading ? "..." : "Check Out"}
              </button>
            </>
          )
        ) : (
          <>
            <p>You haven't checked in today.</p>
            <button disabled={actionLoading} onClick={checkIn}>
              {actionLoading ? "..." : "Check In"}
            </button>
          </>
        )}
      </div>

      <div className="dash-cards-row">
        <div className="dash-card">
          <h4>Present</h4>
          <p>{summary.presentDays || 0}</p>
        </div>
        <div className="dash-card">
          <h4>Absent</h4>
          <p>{summary.absentDays || 0}</p>
        </div>
        <div className="dash-card">
          <h4>Leave</h4>
          <p>{summary.leaveDays || 0}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
