const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyAdmin } = require("../middleware/auth");

// GET /api/manager/employees
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const employees = await User.find({})
      .select("_id name email role")
      .sort({ name: 1 });

    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
