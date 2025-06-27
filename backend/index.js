const db = require("./connect");
const express = require("express");
const session = require("express-session");
const authRoutes = require("./routes/auth");
const consumptionRoutes = require("./routes/consumption_routes");

const app = express();
const PORT = 3000;

db.run("PRAGMA foreign_keys = ON");
app.use(express.json());
app.use(
  session({
    secret: "capstone-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 },
  })
);
app.use("/auth", authRoutes);
app.use("/log", consumptionRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
