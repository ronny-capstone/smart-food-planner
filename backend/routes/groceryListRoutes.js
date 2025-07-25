const baseUrl = process.env.SPOONACULAR_BASE_URL;
const express = require("express");
const path = require("path");
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(dbPath);
const groceryListRoutes = express.Router();
const apiKey = process.env.SPOONACULAR_API_KEY;
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const {
  COST_PATH,
  GENERATE_PATH,
  INGREDIENTS_PATH,
  INFORMATION_PATH,
  EXPORT_PATH,
} = require("../utils/backend_paths.js");
const {
  groceryRecommendation,
} = require("../recommendation/groceryRecommendation.js");
const { exportGroceries } = require("../utils/exportGroceries.js");
const { GENERATE_CONSTANTS } = require("../utils/groceryConstants");

// Get user's full grocery list
groceryListRoutes.get(`${GENERATE_PATH}/:userId`, async (req, res) => {
  const { userId } = req.params;
  const {
    budget = GENERATE_CONSTANTS.BUDGET,
    allowRepeats = false,
    maxRepeats = 1,
  } = req.query;
  try {
    db.all(
      `SELECT * FROM inventory WHERE user_id = ?`,
      [userId],
      async (err, inventory) => {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching inventory items",
          });
        }

        if (inventory.length === 0) {
          return res.json({
            success: true,
            recipes: [],
            message: "No inventory items",
          });
        }

        try {
          const listTypes = await groceryRecommendation(
            userId,
            {
              budget: parseFloat(budget),
              allowRepeats: allowRepeats === "true",
              maxRepeats: parseInt(maxRepeats),
            },
            inventory
          );

          if (!listTypes || Object.keys(listTypes).length === 0) {
            return res.json({
              success: true,
              types: null,
              message: "No meal plans could be generated.",
            });
          }

          const response = {
            success: true,
            types: {
              bestOverall: {
                ...listTypes.bestOverall,
                budgetUsed: listTypes.bestOverall.totalCost
                  ? Number(
                      (
                        (listTypes.bestOverall.totalCost / budget) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
              },
              budgetMaximizer: {
                ...listTypes.budgetMaximized,
                budgetUsed: listTypes.budgetMaximized.totalCost
                  ? Number(
                      (
                        (listTypes.budgetMaximized.totalCost / budget) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
              },
              inventoryMaximizer: {
                ...listTypes.inventoryMaximized,
                budgetUsed: listTypes.inventoryMaximized.totalCost
                  ? Number(
                      (
                        (listTypes.inventoryMaximized.totalCost / budget) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
              },
              complexityMaximizer: {
                ...listTypes.complexityMaximized,
                budgetUsed: listTypes.complexityMaximized.totalCost
                  ? Number(
                      (
                        (listTypes.complexityMaximized.totalCost / budget) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
              },
            },
            budget: budget,
            message: "Generated three grocery list types successfully!",
          };

          res.json(response);
        } catch (err) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error generating grocery list",
          });
        }
      }
    );
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unexpected server error",
    });
  }
});

groceryListRoutes.get(`${COST_PATH}/:userId`, async (req, res) => {
  const { ingredientId, amount, unit } = req.query;

  try {
    const response = await axios.get(
      `${baseUrl}${INGREDIENTS_PATH}/${ingredientId}${INFORMATION_PATH}`,
      {
        params: {
          apiKey,
          amount: amount,
          unit: unit,
        },
      }
    );

    const ingredientInfo = response.data;
    // Get cost in dollars
    const cost = ingredientInfo.estimatedCost.value / 100;
    res.status(StatusCodes.OK).json({
      id: ingredientInfo.id,
      name: ingredientInfo.name,
      amount: amount,
      unit: unit,
      price: cost,
      image: ingredientInfo.image,
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error getting ingredient information",
    });
  }
});

// Export grocery list
groceryListRoutes.post(`${EXPORT_PATH}`, async (req, res) => {
  const { groceryListText } = req.body;
  try {
    const response = await exportGroceries(groceryListText);
    res.status(StatusCodes.OK).json(response);
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to export groceries" });
  }
});

module.exports = groceryListRoutes;
