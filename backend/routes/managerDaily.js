const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { verifyAdmin } = require("../middleware/auth");

function getStartOfDay(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/manager/daily?date=YYYY-MM-DD
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const day = getStartOfDay(date);

    const employees = await User.find({}).select("_id name email role");

    const records = await Attendance.find({
      date: day,
    });

    const recordMap = new Map();
    records.forEach((r) => {
      recordMap.set(r.user.toString(), r);
    });

    const response = employees.map((emp) => {
      const rec = recordMap.get(emp._id.toString());
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        status: rec ? rec.status : "No Record",
        checkInTime: rec?.checkInTime || null,
        checkOutTime: rec?.checkOutTime || null,
        totalHours: rec?.totalHours || 0,
      };
    });

    res.json(response);
  } catch (err) {
    console.error("Daily dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
