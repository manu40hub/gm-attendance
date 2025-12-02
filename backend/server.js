const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: ".env.example" });

const app = express();
app.use(express.json());
// CORS CONFIG – allow localhost (dev) + vercel (prod)
app.use(cors());
app.options("*", cors());


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error: " + err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/manager", require("./routes/manager"));
app.use("/api/user", require("./routes/users"));
app.use("/api/leave", require("./routes/leave"));

app.use("/api/manager/employees", require("./routes/managerEmployees"));
app.use("/api/manager/daily", require("./routes/managerDaily"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
