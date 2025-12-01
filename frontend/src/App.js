import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/LoginPage/Login";
import Register from "./pages/RegisterPage/Register";
import Overview from "./pages/OverviewPage/Overview";
import Leave from "./pages/LeavePage/Leave";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import ManagerDashboard from "./pages/AdminDashboardPage/ManagerDashboard";
import ManagerEmployees from "./pages/ManagerEmployeesPage/ManagerEmployees";
import ManagerEmployeeAttendance from "./pages/ManagerEmployeeAttendance";
import ManagerDailyAttendance from "./pages/ManagerDailyAttendance";
import ManagerEditEmployee from "./pages/ManagerEditEmployee";
import ManagerLeaves from "./pages/ManagerLeaves";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Router>
          <Navbar />
          <div className="content-wrap">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Overview />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/manager" element={<ManagerDashboard/>} />
              <Route path="/manager/employees" element={<ManagerEmployees />} />
              <Route path="/manager/attendance/:userId" element={<ManagerEmployeeAttendance />} />
              <Route path="/manager/daily-attendance" element={<ManagerDailyAttendance />} />
              <Route path="/manager/employee/:userId/edit" element={<ManagerEditEmployee />} />
              <Route path="/manager/leaves" element={<ManagerLeaves />} />
              <Route path="/profile" element={<Profile />} />

            </Routes>
          </div>
          <Footer />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
