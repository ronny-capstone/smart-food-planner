import db from "./connect.js";
import express from "express";

const app = express();
const PORT = 3000;

db.run("PRAGMA foreign_keys = ON");

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
