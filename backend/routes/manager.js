const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { verifyAdmin } = require("../middleware/auth"); // admin == manager

// Utility: get start & end of a day
function getDayRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return { start: d, end: next };
}

function getStartOfDay(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}


/**
 * GET /api/manager/attendance?date=YYYY-MM-DD
 * Protected by verifyAdmin (Manager role)
 */
router.get("/attendance", verifyAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayRange(date);

    // all employees
    const employees = await User.find({ role: "employee" }).select(
      "_id name email"
    );

    // attendance records for that day
    const attendanceDocs = await Attendance.find({
      date: { $gte: start, $lt: end },
    }).populate("user", "name email");

    const attendanceMap = new Map();
    attendanceDocs.forEach((att) => {
      attendanceMap.set(att.user._id.toString(), att);
    });

    const rows = employees.map((emp) => {
      const att = attendanceMap.get(emp._id.toString());
      return {
        userId: emp._id,
        name: emp.name,
        email: emp.email,
        status: att ? att.status : "No Record",
        checkInTime: att?.checkInTime || null,
        checkOutTime: att?.checkOutTime || null,
        totalHours: att?.totalHours || 0,
      };
    });

    const presentCount = rows.filter((r) => r.status === "Present").length;
    const leaveCount = rows.filter((r) => r.status === "Leave").length;
    const absentCount = rows.filter(
      (r) => r.status === "Absent" || r.status === "No Record"
    ).length;

    res.json({
      date: start,
      totalEmployees: employees.length,
      presentCount,
      absentCount,
      leaveCount,
      rows,
    });
  } catch (err) {
    console.error("Manager attendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------------------
// GET /api/manager/attendance/export/:userId?year=YYYY&month=MM
// Manager CSV Export for a single employee & month
// -------------------------------------------
router.get("/attendance/export/:userId", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    let { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    year = parseInt(year, 10);
    month = parseInt(month, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid year or month" });
    }

    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Start & end of month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Fetch attendance docs this month
    const records = await Attendance.find({
      user: userId,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 });

    // Map by date string YYYY-MM-DD
    const recMap = new Map();
    records.forEach((rec) => {
      const d = new Date(rec.date);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      recMap.set(key, rec);
    });

    // Build CSV lines
    const header = [
      "Date",
      "Status",
      "CheckInTime",
      "CheckOutTime",
      "TotalHours",
    ];
    const lines = [];
    lines.push(header.join(","));

    // Loop over each day in month
    const daysInMonth = new Date(year, month, 0).getDate(); // last day

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const rec = recMap.get(dateStr);

      const status = rec ? rec.status : "No Record";

      const checkInTime = rec?.checkInTime
        ? new Date(rec.checkInTime).toISOString()
        : "";
      const checkOutTime = rec?.checkOutTime
        ? new Date(rec.checkOutTime).toISOString()
        : "";
      const totalHours = rec?.totalHours != null ? rec.totalHours : "";

      lines.push(
        [
          dateStr,
          status,
          checkInTime,
          checkOutTime,
          totalHours,
        ]
          .map((v) => (v === null || v === undefined ? "" : v))
          .join(",")
      );
    }

    const csv = lines.join("\n");

    const safeName = user.name.replace(/[^a-z0-9]+/gi, "_");
    const fileName = `attendance_${safeName}_${year}-${String(month).padStart(
      2,
      "0"
    )}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    return res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Server error during CSV export" });
  }
});

// -------------------------------------------
// POST /api/manager/attendance/manual
// Manager manually sets status for a date
// Body: { userId, date: 'YYYY-MM-DD', status }
// -------------------------------------------
router.post("/attendance/manual", verifyAdmin, async (req, res) => {
  try {
    const { userId, date, status } = req.body;

    if (!userId || !date || !status) {
      return res.status(400).json({ message: "userId, date & status required" });
    }

    const allowed = ["Present", "Absent", "Leave"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const day = getStartOfDay(date);

    let attendance = await Attendance.findOne({
      user: userId,
      date: day,
    });

    if (!attendance) {
      // create new record
      attendance = new Attendance({
        user: userId,
        date: day,
        status,
        // manual marking, no check-in/out by default
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
      });
    } else {
      // update existing
      attendance.status = status;

      // if manager marks Absent/Leave, clear times
      if (status !== "Present") {
        attendance.checkInTime = null;
        attendance.checkOutTime = null;
        attendance.totalHours = 0;
      }
    }

    await attendance.save();

    return res.json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (err) {
    console.error("Manager manual attendance error:", err);
    res.status(500).json({ message: "Server error while updating attendance" });
  }
});

// -------------------------------------------
// PUT /api/manager/employee/update/:userId
// Manager edits employee info
// -------------------------------------------
router.put("/employee/update/:userId", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, password } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    if (password) {
      user.password = password; // hashed in User model pre-save hook
    }

    await user.save();

    res.json({ message: "Employee updated successfully", user });
  } catch (err) {
    console.error("Manager update employee error:", err);
    res.status(500).json({ message: "Server error while updating employee" });
  }
});


// -------------------------------------------
// GET /api/manager/analytics/monthly?year=YYYY&month=MM
// Monthly attendance analytics for charts
// -------------------------------------------
router.get("/analytics/monthly", verifyAdmin, async (req, res) => {
  try {
    let { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    year = parseInt(year, 10);
    month = parseInt(month, 10); // 1–12

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid year or month" });
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const records = await Attendance.find({
      date: { $gte: monthStart, $lt: monthEnd },
    });

    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyPresentCounts = Array(daysInMonth).fill(0);

    let present = 0;
    let absent = 0;
    let leave = 0;

    records.forEach((rec) => {
      const d = rec.date instanceof Date ? rec.date : new Date(rec.date);
      const day = d.getDate(); // 1..31

      const status = (rec.status || "").toLowerCase().trim();

      if (status === "present") {
        present++;
        if (day >= 1 && day <= daysInMonth) {
          dailyPresentCounts[day - 1] += 1;
        }
      } else if (status === "absent") {
        absent++;
      } else if (status === "leave") {
        leave++;
      }
    });

    const dailyData = dailyPresentCounts.map((count, idx) => ({
      day: idx + 1,
      present: count,
    }));

    res.json({
      year,
      month,
      dailyData,
      statusSummary: {
        present,
        absent,
        leave,
      },
    });
  } catch (err) {
    console.error("Monthly analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
