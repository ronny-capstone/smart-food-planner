require("dotenv").config({ path: "./.env" });
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const foodRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const apiKey = process.env.SPOONACULAR_API_KEY;
const baseUrl = process.env.SPOONACULAR_BASE_URL;
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const { SEARCH_PATH, NUTRITION_PATH } = require("../../frontend/src/utils/paths.jsx").default;
const db = new sqlite3.Database(dbPath);

const checkInvalidVariable = (variable) => {
  return variable === undefined || variable === null || variable === "";
};

// Get all food items
foodRoutes.get("/", async (req, res) => {
  db.all("SELECT * FROM food_items", async (err, rows) => {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("Unable to get items");
    }
    return res.status(StatusCodes.OK).json(rows);
  });
});

// Search for food item
foodRoutes.get(SEARCH_PATH, async (req, res) => {
  const item = req.query.query;
  if (!item) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing query parameter" });
  }
  try {
    const response = await axios.get(
      `${baseUrl}/ingredients/search?query=${item}&number=2&apiKey=${apiKey}`
    );

    return res.json(response.data);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch food" });
  }
});

// Get nutritional information for food item
foodRoutes.get(NUTRITION_PATH, async (req, res) => {
  const { itemId, amount } = req.query;
  if (!itemId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing query parameter" });
  }
  try {
    const response = await axios.get(
      `${baseUrl}/ingredients/${itemId}/information?amount=${amount}&apiKey=${apiKey}`
    );

    return res.json(response.data);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch nutritional info" });
  }
});

// Add to foodItems db
foodRoutes.post("/", async (req, res) => {
  const { name, calories, protein, carbs, fats, sugars } = req.body;
  if (
    checkInvalidVariable(name) ||
    checkInvalidVariable(calories) ||
    checkInvalidVariable(protein) ||
    checkInvalidVariable(carbs) ||
    checkInvalidVariable(fats) ||
    checkInvalidVariable(sugars)
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing required fields" });
  }
  try {
    db.run(
      `INSERT INTO food_items (name, calories, protein, carbs, fats, sugars) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, calories, protein, carbs, fats, sugars],
      function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: err.message });
        }
        return res.status(StatusCodes.CREATED).json({
          id: this.lastID,
          name: name,
          calories: calories,
          protein: protein,
          carbs: carbs,
          fats: fats,
          sugars: sugars,
        });
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while adding a food item",
      error: err.message,
    });
  }
});

module.exports = foodRoutes;
