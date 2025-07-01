require("dotenv").config({ path: "./.env" });
const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const foodRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const apiKey = process.env.SPOONACULAR_API_KEY;
const baseUrl = process.env.SPOONACULAR_BASE_URL;

const db = new sqlite3.Database(dbPath);

// Search for food item
foodRoutes.get("/", async (req, res) => {
  const item = req.query.query;
  if (!item) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing query parameter" });
  }

  try {
    const response = await axios.get(
      `${baseUrl}/food?query=${item}&number=2&apiKey=${apiKey}`
    );

    return res.json(response.data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch food" });
  }
});

module.exports = foodRoutes;
