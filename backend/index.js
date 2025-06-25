import db from "./connect.js";
const express = require("express");

const app = express();
const PORT = 3000;

db.run("PRAGMA foreign_keys = ON");

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.set("content-type", "application/json");
  const sql = "SELECT * FROM users";
  let data = { users: [] };
  try {
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
        data.users.push({ id: row.user_id, username: row.username });
      });
      let content = JSON.stringify(data);
      res.send(content);
    });
  } catch (err) {
    res.send(`Error:  ${err.message}`);
  }
});

app.post("/api", (req, res) => {
  res.set("content-type", "application/json");
  const sql =
    "INSERT INTO users (user_id, username, password, health_goal, dietary_preferences, age, ) VALUES (?, ?, ?, ";
  let data = { users: [] };
  try {
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
        data.users.push({ id: row.user_id, username: row.username });
      });
      let content = JSON.stringify(data);
      res.send(content);
    });
  } catch (err) {
    res.send(`Error:  ${err.message}`);
  }
});

app.delete("/api", (req, res) => {
  res.send("Hello world");
});