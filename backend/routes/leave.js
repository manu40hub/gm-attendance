const express = require("express");
const router = express.Router();
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");
const { verifyAdmin } = require("../middleware/auth");

// helper: start-of-day
function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

// helper: iterate dates inclusive
function getDateRange(start, end) {
  const dates = [];
  const current = startOfDay(start);
  const last = startOfDay(end);

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * POST /api/leave/apply
 * Employee apply for leave
 * body: { startDate, endDate, type, reason }
 */
router.post("/apply", auth, async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res
        .status(400)
        .json({ message: "Start date, end date & reason are required" });
    }

    const leave = new Leave({
      user: req.user._id,
      startDate,
      endDate,
      type,
      reason,
      status: "Pending",
    });

    await leave.save();

    res.status(201).json({ message: "Leave request submitted", leave });
  } catch (err) {
    console.error("Leave apply error:", err);
    res.status(500).json({ message: "Server error while applying for leave" });
  }
});

/**
 * GET /api/leave/my
 * Employee: view own leaves
 */
router.get("/my", auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(leaves);
  } catch (err) {
    console.error("Leave my error:", err);
    res.status(500).json({ message: "Server error while fetching leaves" });
  }
});

/**
 * GET /api/leave/pending
 * Manager: view all pending leaves
 */
router.get("/pending", verifyAdmin, async (req, res) => {
  try {
    const leaves = await Leave.find({ status: "Pending" })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    res.json(leaves);
  } catch (err) {
    console.error("Leave pending error:", err);
    res.status(500).json({ message: "Server error while fetching pending leaves" });
  }
});

/**
 * PUT /api/leave/:id/approve
 * Manager: approve leave & mark Attendance as "Leave"
 */
router.put("/:id/approve", verifyAdmin, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be approved" });
    }

    leave.status = "Approved";
    await leave.save();

    // create/update Attendance for each date in range as Leave
    const dates = getDateRange(leave.startDate, leave.endDate);
    for (const d of dates) {
      const date = startOfDay(d);

      let attendance = await Attendance.findOne({
        user: leave.user,
        date,
      });

      if (!attendance) {
        attendance = new Attendance({
          user: leave.user,
          userId: leave.user, // for compatibility with old code
          date,
          status: "Leave",
          checkInTime: null,
          checkOutTime: null,
          totalHours: 0,
        });
      } else {
        attendance.status = "Leave";
        attendance.checkInTime = null;
        attendance.checkOutTime = null;
        attendance.totalHours = 0;
      }

      await attendance.save();
    }

    res.json({ message: "Leave approved", leave });
  } catch (err) {
    console.error("Leave approve error:", err);
    res.status(500).json({ message: "Server error while approving leave" });
  }
});

/**
 * PUT /api/leave/:id/reject
 * Manager: reject leave
 */
router.put("/:id/reject", verifyAdmin, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be rejected" });
    }

    leave.status = "Rejected";
    await leave.save();

    res.json({ message: "Leave rejected", leave });
  } catch (err) {
    console.error("Leave reject error:", err);
    res.status(500).json({ message: "Server error while rejecting leave" });
  }
});

module.exports = router;
