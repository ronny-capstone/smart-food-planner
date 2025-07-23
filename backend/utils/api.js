const { getOwnedIngredients } = require("./groceryUtils");
const { COST_PATH, GROCERY_LIST_PATH } = require("./backend_paths");
const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const fs = require("fs");

const ingredientCostCache = new Map();

// Load cache from file
try {
  const cacheData = fs.readFileSync("ingredientCostCache.json", "utf-8");
  const cacheArray = JSON.parse(cacheData);
  for (const [key, value] of cacheArray) {
    ingredientCostCache.set(key, value);
  }
} catch (err) {
  console.log("No existing cache file found");
}

// Fetch estimated cost of ingredient from Spoonacular API
const getIngredientCost = async (
  ingredientId,
  quantity,
  ingredientUnit,
  userId
) => {
  // Create cache key for ingredient
  const cacheKey = `${ingredientId}`;

  // Check cache first
  if (ingredientCostCache.has(cacheKey)) {
    const cached = ingredientCostCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // Calculate actual cost based on quantity
    const actualCost = cached.costPerUnit * quantity;
    return {
      cost: actualCost,
      ingredient: cached.ingredient,
      amount: quantity,
      unit: ingredientUnit,
    };
  }

  // Fetch cost information for 1 unit of ingredient
  try {
    const response = await axios.get(
      `${baseUrl}${GROCERY_LIST_PATH}${COST_PATH}/${userId}`,
      {
        params: {
          ingredientId,
          amount: 1,
          unit: ingredientUnit,
        },
      }
    );

    const unitCostInfo = {
      costPerUnit: response.data.price,
      ingredient: response.data.name,
      unitAmount: response.data.amount,
      unit: response.data.unit,
    };

    // Store in cache and save
    ingredientCostCache.set(cacheKey, unitCostInfo);
    const cacheArray = Array.from(ingredientCostCache.entries());
    fs.writeFileSync(
      "ingredientCostCache.json",
      JSON.stringify(cacheArray),
      "utf-8"
    );
    // Calculate actual cost based on quantity
    const actualCost = unitCostInfo.costPerUnit * quantity;
    return {
      cost: actualCost,
      ingredient: unitCostInfo.ingredient,
      amount: quantity,
      unit: ingredientUnit,
    };
  } catch (err) {
    console.log("Error getting cost for ingredient");
    ingredientCostCache.set(cacheKey, null);
    const cacheArray = Array.from(ingredientCostCache.entries());
    fs.writeFileSync(
      "ingredientCostCache.json",
      JSON.stringify(cacheArray),
      "utf-8"
    );
    return null;
  }
};

// Calculate metrics for a recipe
const calculateRecipeMetrics = async (userId, recipe, inventory) => {
  try {
    const usedIngredients = recipe.usedIngredients || [];
    const missedIngredients = recipe.missedIngredients || [];
    // Use extended ingredients if available, otherwise use both used and missed
    const totalIngredients = recipe.extendedIngredients || [
      ...usedIngredients,
      ...missedIngredients,
    ];
    const ownedIngredients = getOwnedIngredients(recipe, inventory);

    let cost = 0;
    for (const ingredient of missedIngredients) {
      try {
        const costInfo = await getIngredientCost(
          ingredient.id,
          ingredient.amount,
          ingredient.unit,
          userId
        );
        if (costInfo && costInfo.cost) {
          cost += costInfo.cost;
        } else {
          console.log(`No cost returned for: ${ingredient.name}`);
        }
      } catch (err) {
        console.log("Failed for ", ingredient.name, err.message);
      }
    }

    const metrics = {
      numTotalIngredients: totalIngredients.length,
      numMissingIngredients: missedIngredients.length,
      cost: Number(cost.toFixed(2)),
      inventoryUsage: Number(
        (ownedIngredients.length / totalIngredients.length).toFixed(2)
      ),
      ownedIngredients,
    };
    return metrics;
  } catch (err) {
    console.error(`Error calculating metrics for recipe ${recipe.title}`, err);
    return {
      numTotalIngredients: 0,
      numMissingIngredients: 0,
      cost: 0,
      inventoryUsage: 0,
      ownedIngredients: [],
    };
  }
};

// Calculates total cost for shopping list
const calculateShoppingListCost = async (shoppingList, userId) => {
  let totalCost = 0;
  const shoppingListCosts = [];

  // Find price of each ingredient through API
  for (const item of shoppingList) {
    try {
      const costInfo = await getIngredientCost(
        item.id,
        item.quantity,
        item.unit,
        userId
      );
      if (costInfo && costInfo.cost) {
        // Add cost to running total
        totalCost += costInfo.cost;
        shoppingListCosts.push({
          ...item,
          itemCost: Number(costInfo.cost.toFixed(2)),
          costInfo: costInfo,
        });
      } else {
        shoppingListCosts.push({
          ...item,
          itemCost: 0,
          costInfo: null,
        });
      }
    } catch (err) {
      shoppingListCosts.push({
        ...item,
        itemCost: 0,
        costInfo: null,
      });
    }
  }

  return { shoppingList: shoppingListCosts, totalCost: totalCost.toFixed(2) };
};

module.exports = {
  getIngredientCost,
  calculateRecipeMetrics,
  calculateShoppingListCost,
};
