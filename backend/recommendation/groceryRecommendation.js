const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const { RECIPES_PATH, REC_PATH } = require("../utils/backend_paths.js");

const {
  analyzeInventory,
  selectRecipesUnderBudget,
  calculateShoppingAndExpiring,
} = require("../utils/groceryUtils.js");
const {
  calculateRecipeMetrics,
  calculateShoppingListCost,
} = require("../utils/api.js");

// Generate three optimized grocery lists, based on user budget and inventory
const groceryRecommendation = async (userId, preferences, inventory) => {
  const { budget } = preferences;

  try {
    // Generate all three meal plans
    const mealPlan = await generateMealPlans(userId, budget, inventory);

    // If no meal plans could be planned
    if (!mealPlan || Object.keys(mealPlan).length === 0) {
      return {
        budgetMaximized: {
          recipes: [],
          mealsCount: 0,
          totalCost: 0,
          type: "Budget Maximizer",
        },
        inventoryMaximizer: {
          recipes: [],
          mealsCount: 0,
          totalCost: 0,
          type: "Inventory Maximizer",
        },

        complexityMaximizer: {
          recipes: [],
          mealsCount: 0,
          totalCost: 0,
          type: "Complexity Maximizer",
        },

        message: "No meals could be planned",
      };
    }
    return mealPlan;
  } catch (err) {
    return {
      budgetMaximized: {
        recipes: [],
        mealsCount: 0,
        totalCost: 0,
        type: "Budget Maximizer",
      },
      inventoryMaximizer: {
        recipes: [],
        mealsCount: 0,
        totalCost: 0,
        type: "Inventory Maximizer",
      },

      complexityMaximizer: {
        recipes: [],
        mealsCount: 0,
        totalCost: 0,
        type: "Complexity Maximizer",
      },

      message: "Error generating grocery recommendations",
    };
  }
};

// Generates three grocery list types by fetching recipes from recommendation API
// and calculating metrics (cost, inventory usage, etc.) for each recipe
const generateMealPlans = async (userId, budget, inventory) => {
  try {
    // Call recipe recommendation system to get base recipes
    const response = await axios.get(
      `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
      {
        params: {
          ingredientType: "partial",
          maxMissing: 4,
          priority: "balanced",
          expirationToggle: true,
          useCase: "grocery",
        },
      }
    );
    const recipes = response.data.recipes || [];

    if (recipes.length === 0) {
      return {
        budgetMaximized: {
          recipes: [],
          mealsCount: 0,
          totalCost: 0,
          type: "Budget Maximizer",
        },
        inventoryMaximized: {
          recipes: [],
          mealsCount: 0,
          totalCost: 0,
          type: "Inventory Maximizer",
        },
        complexityMaximized: {
          recipes: [],
          mealsCount: 0,
          totalCost: 0,
          type: "Complexity Maximizer",
        },
      };
    }

    // Get cost and inventory analysis for each recipe
    const validRecipes = recipes.filter((recipe) => {
      const isValid = recipe && recipe.title && recipe.id;
      if (!isValid) {
        console.log(`Skipping invalid recipe: ${recipe}`);
      }
      return isValid;
    });
    const recipesWithMetrics = [];
    for (let i = 0; i < validRecipes.length; i++) {
      const recipe = validRecipes[i];
      try {
        const metrics = await calculateRecipeMetrics(userId, recipe, inventory);
        recipesWithMetrics.push({ ...recipe, ...metrics });
      } catch (err) {
        const fallbackMetrics = {
          ...recipe,
          numTotalIngredients: recipe.extendedIngredients?.length || 0,
          numMissingIngredients: recipe.missedIngredients?.length || 0,
          cost: Math.random() * 5 + 1,
          inventoryUsage: Math.random() * 0.8 + 0.1,
          ownedIngredients: [],
        };
        recipesWithMetrics.push(fallbackMetrics);
      }
    }

    // Generates grocery list optimized for budget usage
    const budgetMaximized = await generateBudgetMaximized(
      recipesWithMetrics,
      budget,
      inventory,
      userId
    );

    // Generates grocery list optimized for inventory usage
    const inventoryMaximized = await generateInventoryMaximized(
      recipesWithMetrics,
      budget,
      inventory,
      userId
    );

    // Generates grocery list optimized for recipe complexity
    const complexityMaximized = await generateComplexityMaximized(
      recipesWithMetrics,
      budget,
      inventory,
      userId
    );

    const bestOverall = await generateBestOverall(
      recipesWithMetrics,
      budget,
      inventory,
      userId
    );

    return {
      budgetMaximized,
      inventoryMaximized,
      complexityMaximized,
      bestOverall,
    };
  } catch (err) {
    return {
      budgetMaximized: {
        recipes: [],
        mealsCount: 0,
        totalCost: 0,
        type: "Budget Maximizer",
      },
      inventoryMaximized: {
        recipes: [],
        mealsCount: 0,
        totalCost: 0,
        type: "Inventory Maximizer",
      },
      complexityMaximized: {
        recipes: [],
        mealsCount: 0,
        totalCost: 0,
        type: "Complexity Maximizer",
      },
    };
  }
};

// Generates "best overall" grocery list that combines all 3 approaches
const generateBestOverall = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId
) => {
  // Calculate scores
  const weights = {
    budget: 0.5,
    inventory: 0.35,
    complexity: 0.15,
  };

  const maxValues = normalizeScores(recipesWithMetrics);
  const recipesWithScores = recipesWithMetrics.map((recipe) => {
    const scores = calculateRecipeScores(recipe, maxValues);
    const totalScore =
      scores.budget * weights.budget +
      scores.inventory * weights.inventory +
      scores.complexity * weights.complexity;
    return {
      ...recipe,
      scores: {
        ...scores,
        total: totalScore,
      },
    };
  });
  // Sort by overall score, highest to lowest
  const sortedRecipes = recipesWithScores.sort(
    (a, b) => b.scores.total - a.scores.total
  );
  // Select recipes within budget
  const selectedRecipes = [];
  let totalCost = 0;
  for (const recipe of sortedRecipes) {
    const recipeCost = recipe.cost || 0;
    if (totalCost + recipeCost <= budget) {
      selectedRecipes.push(recipe);
      totalCost += recipeCost;
    }
  }

  const mealsCount = selectedRecipes.length;
  const budgetUsed = (totalCost / budget) * 100;
  const groceryList = await generateGroceryList(
    selectedRecipes,
    inventory,
    userId
  );

  return {
    type: "Best Overall",
    recipes: selectedRecipes,
    totalCost: Number(totalCost.toFixed(2)),
    mealsCount: mealsCount,
    avgCostPerMeal:
      mealsCount > 0 ? Number((totalCost / mealsCount).toFixed(2)) : 0,
    budgetUtilization: Number((totalCost / budget).toFixed(2)),
    budgetUsed: Number(budgetUsed.toFixed(1)),
    budgetRemaining: Number((budget - totalCost).toFixed(2)),
    groceryList: groceryList,
  };
};

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

// Calculate scores for a recipe, from 0-1
const calculateRecipeScores = (recipe, minMaxValues) => {
  const { minCost, maxCost, minIngredients, maxIngredients } = minMaxValues;

  // Budget score - cheaper recipe = higher score
  let budgetScore = 1;
  if (maxCost > minCost) {
    // Reverse scaling because cheaper = higher score
    budgetScore = 1 - (recipe.cost - minCost) / (maxCost - minCost);
  } else {
    budgetScore = 1;
  }

  // Complexity score - recipes with more total ingredients = higher scores
  let complexityScore = 0;
  if (maxIngredients > minIngredients) {
    complexityScore =
      (recipe.numTotalIngredients - minIngredients) /
      (maxIngredients - minIngredients);
  } else {
    complexityScore = 0;
  }

  // Inventory score - already in 0-1 range bc percentage of ingredients you own
  const inventoryScore = recipe.inventoryUsage || 0;
  return {
    budget: budgetScore,
    inventory: inventoryScore,
    complexity: complexityScore,
  };
};

// Generates grocery list that maximizes meals for minimum cost
// Prioritizes fewest missing ingredients, then lowest recipe cost
const generateBudgetMaximized = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId
) => {
  // Sort recipes to prioritize cost efficiency
  const budgetOptimized = recipesWithMetrics.sort((a, b) => {
    // Prioritize by lowest cost
    if (a.cost !== b.cost) {
      return a.cost - b.cost;
    }

    // Then by fewest missing ingredients
    return a.numMissingIngredients - b.numMissingIngredients;
  });

  // Get as many recipes as fit in budget
  const { validRecipes, remainingBudget } = selectRecipesUnderBudget(
    budgetOptimized,
    budget
  );

  // Generate grocery list with costs
  const groceryList = await generateGroceryList(
    validRecipes,
    inventory,
    userId
  );

  return {
    type: "Budget Maximizer",
    recipes: validRecipes,
    totalCost: budget - remainingBudget,
    mealsCount: validRecipes.length,
    avgCostPerMeal:
      validRecipes.length > 0
        ? Number(((budget - remainingBudget) / validRecipes.length).toFixed(2))
        : 0,
    budgetUtilization: Number(((budget - remainingBudget) / budget).toFixed(2)),
    groceryList,
    budgetRemaining: remainingBudget,
  };
};

// Generates grocery list that maximizes usage of inventory
// Prioritizes high inventory usage, then fewest missing ingredients
const generateInventoryMaximized = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId
) => {
  // Sort recipes to prioritize inventory usage
  const inventoryOptimized = recipesWithMetrics.sort((a, b) => {
    if (a.inventoryUsage > b.inventoryUsage) {
      // Prioritize high inventory usage
      return b.inventoryUsage - a.inventoryUsage;
    }
    // Then, by fewest missing ingredients
    return a.numMissingIngredients - b.numMissingIngredients;
  });

  // Get as many recipes as fit in budget
  const { validRecipes, remainingBudget, usedInventory } =
    selectRecipesUnderBudget(inventoryOptimized, budget);

  // Generate grocery list with costs
  const groceryList = await generateGroceryList(
    validRecipes,
    inventory,
    userId
  );
  return {
    type: "Inventory Maximizer",
    recipes: validRecipes,
    totalCost: budget - remainingBudget,
    mealsCount: validRecipes.length,
    avgCostPerMeal:
      validRecipes.length > 0
        ? Number(((budget - remainingBudget) / validRecipes.length).toFixed(2))
        : 0,
    inventoryUtilization: Number(
      (usedInventory.size / inventory.length).toFixed(2)
    ),
    groceryList,
    inventoryItemsUsed: usedInventory.size,
    budgetRemaining: remainingBudget,
  };
};

// Generates grocery list that maximizes complexity of recipes
// Prioritizes highest total ingredients, then longest prep time
const generateComplexityMaximized = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId
) => {
  // Sort recipes to prioritize recipe complexity
  const complexityOptimized = recipesWithMetrics.sort((a, b) => {
    if (a.numTotalIngredients > b.numTotalIngredients) {
      // Prioritize most total ingredients
      return b.numTotalIngredients - a.numTotalIngredients;
    }
    // Then by longer prep time
    return (b.readyInMinutes || 0) - (a.readyInMinutes || 0);
  });

  // Get as many recipes as fit in budget
  const { validRecipes, remainingBudget } = selectRecipesUnderBudget(
    complexityOptimized,
    budget
  );

  // Generate grocery list with costs
  const groceryList = await generateGroceryList(
    validRecipes,
    inventory,
    userId
  );

  return {
    type: "Complexity Maximizer",
    recipes: validRecipes,
    totalCost: budget - remainingBudget,
    mealsCount: validRecipes.length,
    avgIngredientsPerMeal: Math.ceil(
      validRecipes.reduce((sum, r) => sum + r.numTotalIngredients, 0) /
        validRecipes.length
    ),
    groceryList,
    budgetRemaining: remainingBudget,
  };
};

// Generate comprehensive grocery list with costs for selected recipes
const generateGroceryList = async (recipes, inventory, userId) => {
  if (!recipes || recipes.length === 0) {
    return {
      shoppingList: [],
      inventoryRecommendations: [],
      totalCost: 0,
      expiringItems: [],
      expiringCount: 0,
      itemsNeeded: 0,
      message: "No recipes provided",
    };
  }

  try {
    // Analyze current inventory to find expiration and stock levels of items
    const inventoryAnalysis = analyzeInventory(inventory);

    // Determine what needs to be purchased vs already available
    const {
      shoppingList,
      inventoryRecommendations,
      expiringItems,
      itemsToBuy,
      itemsExpiring,
    } = calculateShoppingAndExpiring(recipes, inventoryAnalysis);

    // If no additional items need to be bought, all ingredients are available
    if (itemsToBuy === 0) {
      return {
        shoppingList: [],
        inventoryRecommendations,
        totalCost: 0,
        expiringItems,
        expiringCount: itemsExpiring,
        itemsNeeded: 0,
        message: "All ingredients already available",
      };
    }

    // Calculate total cost of the shopping list for recipe ingredients
    let shoppingListWithCosts = [];
    let totalCost = 0;
    if (shoppingList.length > 0) {
      const result = await calculateShoppingListCost(shoppingList, userId);
      shoppingListWithCosts = result.shoppingList;
      totalCost = result.totalCost;
    }

    // Return grocery list data
    return {
      shoppingList: shoppingListWithCosts,
      inventoryRecommendations,
      totalCost,
      expiringItems,
      expiringCount: itemsExpiring,
      itemsNeeded: itemsToBuy,
      message: `Found ${itemsToBuy} items to buy`,
    };
  } catch (err) {
    return {
      shoppingList: [],
      inventoryRecommendations: [],
      totalCost: 0,
      expiringItems: [],
      expiringCount: 0,
      itemsNeeded: 0,
    };
  }
};

module.exports = {
  groceryRecommendation,
  generateMealPlans,
  calculateShoppingAndExpiring,
  calculateShoppingListCost,
};
