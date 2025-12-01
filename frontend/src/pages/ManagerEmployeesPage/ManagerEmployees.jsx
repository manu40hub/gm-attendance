import React, { useEffect, useState } from "react";
import api from "../../apiClient";
import { jwtDecode } from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import "./ManagerEmployees.css";

function ManagerEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      return navigate("/login");
    }

    if (decoded.role !== "admin") return navigate("/");

    const fetchEmployees = async () => {
      try {
        const { data } = await api.get(
          "/api/manager/employees",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployees(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [navigate]);

  return (
    <div className="manager-employees-container">
      <h2>Employees List</h2>
      <p className="subtitle">Click an employee to view monthly attendance</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="employees-table-card">
          <table className="employees-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr key={emp._id}>
                  <td>{index + 1}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.role === "admin" ? "Manager" : "Employee"}</td>
                  <td>
                    <Link
                      to={`/manager/attendance/${emp._id}`}
                      className="view-btn"
                    >
                      View Attendance
                    </Link>
                  </td>
                    <td style={{ display: "flex", gap: "10px" }}>
                    <Link to={`/manager/attendance/${emp._id}`} className="view-btn">
                    View
                    </Link>

                    <Link to={`/manager/employee/${emp._id}/edit`} className="edit-btn">
                    Edit
                    </Link>
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

export default ManagerEmployees;
