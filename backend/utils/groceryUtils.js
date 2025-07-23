const { isNameMatch } = require("./stringUtils");
const { INVENTORY_CONSTANTS } = require("./groceryConstants");
const { getDaysUntilExpiration, formatDay } = require("./dateUtils.js");

// Categorize inventory items by expiration/stock status
const analyzeInventory = (inventory) => {
  const expiringSoon = [],
    runningLow = [],
    wellStocked = [],
    expired = [];
  // Check stock and expiration for each inventory item
  inventory.forEach((item) => {
    const daysUntilExpire = getDaysUntilExpiration(item.expiration_date);
    if (daysUntilExpire < INVENTORY_CONSTANTS.EXPIRED) {
      expired.push(item);
    } else if (item.quantity <= INVENTORY_CONSTANTS.LOW_STOCK) {
      runningLow.push(item);
    } else if (daysUntilExpire <= INVENTORY_CONSTANTS.EXPIRING_THREE_DAYS) {
      expiringSoon.push(item);
    } else {
      wellStocked.push(item);
    }
  });
  return { expiringSoon, runningLow, wellStocked, expired };
};

// Identify recipe ingredients that a user already owns in their inventory
const getOwnedIngredients = (recipe, inventory) => {
  const recipeIngredients =
    recipe.extendedIngredients || recipe.usedIngredients || [];
  const ownedIngredients = [];
  recipeIngredients.forEach((ingredient) => {
    const matchingIngredient = inventory.find((item) =>
      isNameMatch(item, ingredient)
    );
    if (matchingIngredient) {
      ownedIngredients.push({
        ...ingredient,
        inventoryItem: matchingIngredient,
      });
    }
  });
  return ownedIngredients;
};

// Select as many recipes as possible within given budget
const selectRecipesUnderBudget = (sortedRecipes, budget) => {
  const validRecipes = [];
  let totalCost = 0;
  const usedInventory = new Set();
  for (const recipe of sortedRecipes) {
    const cost = recipe.cost || 0;
    if (totalCost + cost <= budget) {
      validRecipes.push(recipe);
      recipe.ownedIngredients.forEach((item) => usedInventory.add(item.name));
      totalCost += cost;
    } else {
      break;
    }
  }
  const remainingBudget = budget - totalCost;
  return { validRecipes, remainingBudget, usedInventory };
};

// Calculate shopping list and inventory recommendations
// Determines what ingredients need to be purchased, which expiring items are
// being used in recipes, recommendations expired/low-stock items
const calculateShoppingAndExpiring = (recipes, inventoryAnalysis) => {
  // Items to buy
  const shoppingList = new Map();
  // Expiring items to use in recipes
  const expiringItems = [];
  const inventoryRecommendations = [];

  // Iterate through each recipe in mealPlan
  recipes.forEach((recipe) => {
    const ingredients =
      recipe.extendedIngredients || recipe.missedIngredients || [];
    // Iterate through each ingredient in the recipe
    ingredients.forEach((ingredientData) => {
      const ingredientId = ingredientData.id;

      // Check if this ingredient is well stocked
      const stockedIngredient = inventoryAnalysis.wellStocked.find(
        (item) => item.name.toLowerCase() === ingredientData.name.toLowerCase()
      );
      // Check if we need to buy this ingredient
      if (!stockedIngredient) {
        if (shoppingList.has(ingredientId)) {
          const alreadyExisting = shoppingList.get(ingredientId);

          // Combine ingredient quantities for multiple recipes
          const newQuantity = alreadyExisting.quantity + ingredientData.amount;
          shoppingList.set(ingredientId, {
            ...alreadyExisting,
            quantity: newQuantity,
            unit: ingredientData.unit,
            // Combine recipes that use this ingredient
            recipes: [...alreadyExisting.recipes, recipe.title],
          });
        } else {
          shoppingList.set(ingredientId, {
            id: ingredientId,
            name: ingredientData.name,
            quantity: ingredientData.amount,
            unit: ingredientData.unit,
            recipes: [recipe.title],
            priority: "needed",
          });
        }
      }
    });
  });

  // List of ingredients already in shopping list
  const recipeIngredientNames = Array.from(shoppingList.values()).map((item) =>
    item.name.toLowerCase()
  );
  const allIngredients = [];
  recipes.forEach((recipe) => {
    const ingredients =
      recipe.extendedIngredients || recipe.missedIngredients || [];
    ingredients.forEach((ingredient) => {
      allIngredients.push(ingredient.name.toLowerCase());
    });
  });

  // Remove duplicates
  const uniqueIngredients = [...new Set(allIngredients)];

  // Identify expiring items
  inventoryAnalysis.expiringSoon.forEach((item) => {
    const daysLeft = getDaysUntilExpiration(item.expiration_date);
    // Check if expiring item is used in any recipes
    const usedInRecipe = uniqueIngredients.includes(item.name.toLowerCase());
    if (usedInRecipe) {
      expiringItems.push({
        name: item.name,
        quantity: item.quantity,
        expirationDate: item.expiration_date,
        daysLeft: daysLeft,
        priority: "expiring",
        id: item.id,
      });
    } else {
      // Only add to recommendations if not already in shopping list
      inventoryRecommendations.push({
        name: item.name,
        reason: `Expires in ${formatDay(daysLeft)}`,
        type: "expiring-replacement",
        item: item,
      });
    }
  });

  // Identify expired
  inventoryAnalysis.expired.forEach((item) => {
    const daysLeft = getDaysUntilExpiration(item.expiration_date);

    // Only add to recommendations if not already in shopping list
    if (!recipeIngredientNames.includes(item.name.toLowerCase())) {
      inventoryRecommendations.push({
        name: item.name,
        reason: `Expired ${formatDay(daysLeft)} ago`,
        type: "expiring-replacement",
        item: item,
      });
    }
  });

  inventoryAnalysis.runningLow.forEach((item) => {
    const daysLeft = getDaysUntilExpiration(item.expiration_date);
    if (daysLeft > INVENTORY_CONSTANTS.MIN_RESTOCK_DAYS || 7) {
      if (!recipeIngredientNames.includes(item.name.toLowerCase())) {
        inventoryRecommendations.push({
          name: item.name,
          reason: `Only ${item.quantity} left`,
          type: "low-stock-replacement",
          item: item,
        });
      }
    }
  });

  return {
    shoppingList: Array.from(shoppingList.values()),
    inventoryRecommendations: inventoryRecommendations,
    expiringItems: expiringItems.sort((a, b) => a.daysLeft - b.daysLeft),
    itemsToBuy: shoppingList.size,
    itemsExpiring: expiringItems.length,
  };
};

module.exports = {
  analyzeInventory,
  getOwnedIngredients,
  selectRecipesUnderBudget,
  calculateShoppingAndExpiring,
};
