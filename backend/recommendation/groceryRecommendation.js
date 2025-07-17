const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const { getDaysUntilExpiration } = require("../utils/dateUtils.js");
const { RECIPES_PATH, REC_PATH } = require("../utils/backend_paths.js");
const {
  PRIORITY_CONSTANTS,
  DIETS,
  PREP_CONSTANTS,
  CUISINE_CONSTANTS,
  INGREDIENT_TYPES,
  NUTRIENT_CONSTANTS,
  MACRO_CONSTANTS,
  PREP_BUCKETS,
} = require("../utils/recipeConstants.js");

const groceryRecommendation = async (userId, preferences, inventory) => {
  const { budget, mealsNum, prioritizeExpiring = true } = preferences;
  // TODO: handle diet

  const inventoryAnalysis = analyzeInventory(userId, inventory);
  const mealPlan = await generateMealPlan(userId, preferences);
  const { shoppingList, expiringItems, itemsToBuy, itemsExpiring } =
    calculateShoppingAndExpiring(mealPlan, inventoryAnalysis);
  const shoppingListWithPrices = await mapIngredientsToProducts(
    shoppingList,
    budget
  );
  const optimizedList = optimizeShoppingList(
    shoppingList,
    budget,
    inventoryAnalysis
  );
  return optimizedList;
};

const analyzeInventory = (inventory) => {
  const expiringSoon = [],
    runningLow = [],
    wellStocked = [],
    expired = [];
  // Check stock and expiration for each inventory item
  inventory.forEach((item) => {
    const daysUntilExpire = getDaysUntilExpiration(item.expiration_date);
    if (daysUntilExpire < 0) {
      expired.push(item);
    } else if (item.quantity <= 1) {
      runningLow.push(item);
    } else if (daysUntilExpire <= 3) {
      expiringSoon.push(item);
    } else {
      wellStocked.push(item);
    }

    return { expiringSoon, runningLow, wellStocked, expired };
  });
};

const generateMealPlan = async (userId, preferences) => {
  const { totalMeals = 14, allowRepeats = true, maxRepeats = 2 } = preferences;
  if (allowRepeats) {
    return await generateMealPlanWithRepeats(userId, preferences);
  } else {
    return await generateMealPlanNoRepeats(userId, preferences);
  }
};

const generateMealPlanNoRepeats = async (userId, preferences) => {
  const { totalMeals } = preferences;
  const mealPlan = [];
  const usedRecipes = new Set();

  for (let i = 0; i < totalMeals; i++) {
    try {
      // Call recipe recommendation system
      const response = await axios.get(
        `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
        {
          params: {
            ingredientType: "partial",
            priority: "balanced",
            expirationToggle: true,
            maxMissing: 3,
          },
        }
      );
      // Ensure meals don't repeat in the plan
      const possibleRecipes = response.data.filter(
        (recipe) => !mealPlan.some((planned) => planned.id === recipe.id)
      );

      if (possibleRecipes.length > 0) {
        mealPlan.push(possibleRecipes[0]);
      }
    } catch (err) {
      console.log("Error getting meals");
    }
  }
  return mealPlan;
};

const generateMealPlanWithRepeats = async (userId, preferences) => {
  const { totalMeals, maxRepeats = 2 } = preferences;
  const mealPlan = [];

  for (let i = 0; i < totalMeals; i++) {
    try {
      // Call recipe recommendation system
      const response = await axios.get(
        `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
        {
          params: {
            ingredientType: "partial",
            priority: "balanced",
            expirationToggle: true,
            maxMissing: 3,
          },
        }
      );
      // TODO: handle max repeats
      response.data.forEach((recipe) => mealPlan.push(recipe));
    } catch (err) {
      console.log("Error getting meals");
    }
  }
  return mealPlan;
};

const calculateShoppingAndExpiring = (mealPlan, inventoryAnalysis) => {
  // Items to buy
  const shoppingList = new Map();
  // Items to use up
  const expiringItems = [];

  // Iterate through each recipe in mealPlan
  mealPlan.forEach((recipe) => {
    const ingredients =
      recipe.extendedIngredients || recipe.missedIngredients || [];
    // Iterate through each ingredient in the recipe
    ingredients.forEach((ingredient) => {
      const ingredientName = ingredient.name.toLowerCase();
      // Check if this ingredient is well stocked
      const stockedIngredient = inventoryAnalysis.wellStocked.find(
        (item) => item.name.toLowerCase() === ingredientName
      );
      // Check if we need to buy this ingredient
      if (!stockedIngredient) {
        if (shoppingList.has(ingredientName)) {
          // Combine ingredient quantities for multiple recipes
          const alreadyExisting = shoppingList.get(ingredientName);
          shoppingList.set(ingredientName, {
            ...alreadyExisting,
            quantity: alreadyExisting.amount + ingredient.amount,
            unit: ingredient.unit,
            // Combine recipes that use this ingredient
            recipes: [...alreadyExisting.recipes, recipe.title],
          });
        } else {
          shoppingList.set(ingredientName, {
            name: ingredient.name,
            quantity: ingredient.amount,
            unit: ingredient.unit,
            recipes: [recipe.title],
            priority: "needed",
          });
        }
      }
    });
  });

  // Identify expiring items
  inventoryAnalysis.expiringSoon.forEach((item) => {
    expiringItems.push({
      name: item.name,
      quantity: item.quantity,
      expirationDate: item.expiration_date,
      daysLeft: getDaysUntilExpiration(item.expiration_date),
      priority: "expiring",
    });
  });

  return {
    shoppingList: Array.from(shoppingList.values()),
    expiringItems: expiringItems.sort((a, b) => a.daysLeft - b.daysLeft),
    itemsToBuy: shoppingList.size,
    itemsExpiring: expiringItems.length,
  };
};

const mapIngredientsToProducts = (shoppingList, budget) => {};
