const { isNameMatch, isNameMatchNames } = require("./stringUtils");
const { INVENTORY_CONSTANTS } = require("./groceryConstants");
const { getDaysUntilExpiration, formatDay } = require("./dateUtils.js");

// Normalize scores to 0-1 scale
const normalizeScores = (recipes) => {
  const costs = recipes.map((recipe) => recipe.cost || 0);
  const missingIngredientCounts = recipes.map(
    (recipe) => recipe.numMissingIngredients || 0
  );
  const ingredientCounts = recipes.map(
    (recipe) => recipe.numTotalIngredients || 0
  );

  // Find extremes
  const maxCost = Math.max(...costs);
  const minCost = Math.min(...costs);
  const maxMissing = Math.max(...missingIngredientCounts);
  const minMissing = Math.min(...missingIngredientCounts);
  const maxIngredients = Math.max(...ingredientCounts);
  const minIngredients = Math.min(...ingredientCounts);

  return {
    minCost,
    maxCost,
    minMissing,
    maxMissing,
    minIngredients,
    maxIngredients,
  };
};

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
    // If inventory quantity >= 1, we can use it
    const matchingIngredient = inventory.find((item) => {
      return isNameMatch(ingredient, item) && item.quantity >= 1;
    });
    if (matchingIngredient) {
      ownedIngredients.push({
        ...ingredient,
        inventoryItem: matchingIngredient,
        servingsAvailable: matchingIngredient.quantity,
        // Always 1 serving per ingredient
        servingsNeeded: 1,
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

const createInventoryMap = (inventoryItems) => {
  const inventoryMap = new Map();
  inventoryItems.forEach((item) => {
    const key = item.name.toLowerCase();

    // If multiple items with same name, combine quantities
    if (inventoryMap.has(key)) {
      const existingItem = inventoryMap.get(key);
      inventoryMap.set(key, {
        ...existingItem,
        quantity: existingItem.quantity + item.quantity,
      });
    } else {
      // Create copy
      inventoryMap.set(key, { ...item });
    }
  });
  return inventoryMap;
};

const findIngredientInMap = (inventoryMap, ingredientName) => {
  const name = ingredientName.toLowerCase();

  // Try to find exact match
  if (inventoryMap.has(name)) {
    return { key: name, item: inventoryMap.get(name) };
  }

  // Check match with plurals
  for (const [key, item] of inventoryMap.entries()) {
    if (isNameMatchNames(item.name, ingredientName)) {
      return { key, item };
    }
  }
  return null;
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

  const inventoryMap = createInventoryMap([
    ...inventoryAnalysis.wellStocked,
    ...inventoryAnalysis.expiringSoon,
    ...inventoryAnalysis.runningLow,
  ]);

  // Iterate through each recipe in mealPlan
  recipes.forEach((recipe) => {
    const ingredients =
      recipe.extendedIngredients || recipe.missedIngredients || [];
    // Iterate through each ingredient in the recipe
    ingredients.forEach((ingredientData) => {
      try {
        const ingredientId = ingredientData.id;
        const ingredientName = ingredientData.name;

        // Check if we have >= 1 serving of ingredient in current inventory
        const foundIngredient = findIngredientInMap(
          inventoryMap,
          ingredientName
        );
        if (foundIngredient && foundIngredient.item.quantity >= 1) {
          // Use from inventory (subtract 1 serving)
          foundIngredient.item.quantity -= 1;
          // Remove from inventory if used up
          if (foundIngredient.item.quantity <= 0) {
            inventoryMap.delete(foundIngredient.key);
          }
        } else {
          // Need to buy this ingredient
          if (shoppingList.has(ingredientId)) {
            const alreadyExisting = shoppingList.get(ingredientId);

            // Combine ingredient quantities for multiple recipes
            shoppingList.set(ingredientId, {
              ...alreadyExisting,
              quantity: alreadyExisting.quantity + ingredientData.amount,
              servingsNeeded: alreadyExisting.servingsNeeded + 1,
              // Combine recipes that use this ingredient
              recipes: alreadyExisting.recipes.includes(recipe.title)
                ? alreadyExisting.recipes
                : [...alreadyExisting.recipes, recipe.title],
            });
          } else {
            shoppingList.set(ingredientId, {
              id: ingredientId,
              name: ingredientData.name,
              quantity: ingredientData.amount,
              servingsNeeded: 1,
              recipes: [recipe.title],
            });
          }
        }
      } catch (error) {
        console.log(`Error processing ingredient ${ingredientData.name}:`);
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

  let shoppingArray = Array.from(shoppingList.values());
  // Combine items with identical names
  const nameMap = new Map();
  shoppingArray.forEach((item) => {
    const itemName = item.name.toLowerCase();
    if (nameMap.has(itemName)) {
      // Combine with existing item
      const existing = nameMap.get(itemName);
      nameMap.set(itemName, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        servingsNeeded: existing.servingsNeeded + item.servingsNeeded,
      });
    } else {
      // First occurrence of this name
      nameMap.set(itemName, {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        servingsNeeded: item.servingsNeeded,
      });
    }
  });
  const uniqueShoppingList = Array.from(nameMap.values());

  return {
    shoppingList: uniqueShoppingList,
    inventoryRecommendations: inventoryRecommendations,
    expiringItems: expiringItems.sort((a, b) => a.daysLeft - b.daysLeft),
    itemsToBuy: uniqueShoppingList.length,
    itemsExpiring: expiringItems.length,
  };
};

module.exports = {
  analyzeInventory,
  getOwnedIngredients,
  selectRecipesUnderBudget,
  calculateShoppingAndExpiring,
  normalizeScores,
};
