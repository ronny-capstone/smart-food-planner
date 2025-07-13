require("dotenv").config({ path: "./.env" });
const express = require("express");
const recipeRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const apiKey = process.env.SPOONACULAR_API_KEY;
const baseUrl = process.env.SPOONACULAR_RECIPE_URL;
const checkInvalidVariable = require("../utils/invalidVars.js");

// Filter recipes
recipeRoutes.get("/", async (req, res) => {
  const preferences = req.query;
  const recipeParams = {
    apiKey: apiKey,
    query: preferences.query || "",
    cuisine: preferences.cuisine || "",
    diet: preferences.diet || "",
    type: preferences.type || "",
    includeIngredients: preferences.includeIngredients || "",
    addRecipeInformation: preferences.addRecipeInformation || "",
    fillIngredients: preferences.fillIngredients || "",
    number: preferences.number || "",
    minCarbs: preferences.minCarbs || "",
    maxCarbs: preferences.maxCarbs || "",
    minProtein: preferences.minProtein || "",
    maxProtein: preferences.maxProtein || "",
    minCalories: preferences.minCalories || "",
    maxCalories: preferences.maxCalories || "",
    minFat: preferences.minFat || "",
    maxFat: preferences.maxFat || "",
  };

  Object.keys(recipeParams).forEach((key) => {
    if (recipeParams[key] === "" || recipeParams[key] === undefined) {
      delete recipeParams[key];
    }
  });

  try {
    const response = await axios.get(`${baseUrl}/complexSearch`, {
      params: recipeParams,
    });
    res.json({
      success: true,
      recipes: response.data.results,
      totalResults: response.data.totalResults,
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch recipes" });
  }
});

// Filter recipes by ingredients
recipeRoutes.get("/ingredients", async (req, res) => {
  // Number is max number of recipes
  // Ranking is whether to maximize used ingredients or minimize missing ingredients
  const { ingredients, number, ranking = 2 } = req.query;

  if (checkInvalidVariable(ingredients)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Missing required ingredients parameter",
    });
  }

  const recipeParams = {
    apiKey: apiKey,
    ingredients: ingredients,
    number: number,
    ranking: ranking,
    ignorePantry: true,
  };

  try {
    const response = await axios.get(`${baseUrl}/findByIngredients`, {
      params: recipeParams,
    });

    res.json({
      success: true,
      recipes: response.data,
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch recipes" });
  }
});

// Get recipe information
recipeRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { includeNutrition = true } = req.query;

  const recipeParams = {
    apiKey: apiKey,
    includeNutrition: includeNutrition,
  };

  try {
    const response = await axios.get(`${baseUrl}/${id}/information`, {
      params: recipeParams,
    });

    res.json({
      success: true,
      recipes: response.data,
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch recipe information" });
  }
});

module.exports = recipeRoutes;
