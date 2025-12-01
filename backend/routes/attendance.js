const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const  auth  = require("../middleware/auth");

// Utility function – get start of day
function getStartOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * -----------------------------------------
 * EMPLOYEE: TODAY ATTENDANCE STATUS
 * -----------------------------------------
 */
router.get("/today", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const today = getStartOfDay();

    const attendance = await Attendance.findOne({
      user: userId,
      date: today,
    });

    res.json({ attendance });
  } catch (err) {
    console.error("ERR /today:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------------------
 * EMPLOYEE: CHECK-IN
 * -----------------------------------------
 */
router.post("/checkin", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const now = new Date();
    const today = getStartOfDay(now);

    let attendance = await Attendance.findOne({
      user: userId,
      date: today,
    });

    if (attendance && attendance.checkInTime) {
      return res
        .status(400)
        .json({ message: "You have already checked in today." });
    }

    if (!attendance) {
      attendance = new Attendance({
        user: userId,
        date: today,
        status: "Present",
        checkInTime: now,
        totalHours: 0,
      });
    } else {
      attendance.checkInTime = now;
      attendance.status = "Present";
    }

    await attendance.save();
    res.status(201).json({ message: "Checked in successfully", attendance });
  } catch (err) {
    console.error("ERR /checkin:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------------------
 * EMPLOYEE: CHECK-OUT
 * -----------------------------------------
 */
router.post("/checkout", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const now = new Date();
    const today = getStartOfDay(now);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today,
    });

    if (!attendance || !attendance.checkInTime) {
      return res
        .status(400)
        .json({ message: "You have not checked in today." });
    }

    if (attendance.checkOutTime) {
      return res
        .status(400)
        .json({ message: "You have already checked out today." });
    }

    attendance.checkOutTime = now;

    const diffMs = attendance.checkOutTime - attendance.checkInTime;
    const hours = diffMs / (1000 * 60 * 60);

    attendance.totalHours = Number(hours.toFixed(2));

    await attendance.save();
    res.json({ message: "Checked out successfully", attendance });
  } catch (err) {
    console.error("ERR /checkout:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------------------
 * OLD ATTENDANCE CREATE (ADMIN USE)
 * -----------------------------------------
 */
router.post("/", async (req, res) => {
  const { userId, status ,date } = req.body;
  const theDate = date ? getStartOfDay(new Date(date)) : getStartOfDay();

  const attendance = new Attendance({
    user: userId,
    status,
    date: theDate,
  });

  await attendance.save();
  res.json({ message: "Attendance marked" });
});

/**
 * -----------------------------------------
 * USER FULL MONTH SUMMARY
 * -----------------------------------------
 */
router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year & Month required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const start = new Date(y,m-1 , 1);
    const end = new Date(y,m,1);
    /*end.setMonth(end.getMonth() + 1);*/

    const records = await Attendance.find({
      user: userId,
      date: { $gte: start, $lt: end },
    });

    const presentDays = records.filter(r => r.status === "Present").length;
    const absentDays = records.filter(r => r.status === "Absent").length;
    const leaveDays = records.filter(r => r.status === "Leave").length;

    res.json({
      userName: user.name,
      userEmail: user.email,
      year,
      month,
      presentDays,
      absentDays,
      leaveDays,
    });
  } catch (err) {
    console.error("ERR /summary:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * -----------------------------------------
 * USER MONTHLY FULL DETAILS (Daily table)
 * -----------------------------------------
 */
router.get("/details/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let { year, month } = req.query;

    year = parseInt(year,10);
    month = parseInt(month,10);

    if (!year || !month)
      return res.status(400).json({ message: "Year & Month required" });

    const start = new Date(year,month-1,1);
    const end = new Date(year,month,1);
    

    const records = await Attendance.find({
      user: userId,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 });

    res.json(records);
  } catch (err) {
    console.error("ERR /details:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
