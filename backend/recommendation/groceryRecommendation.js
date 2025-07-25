const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const { RECIPES_PATH, REC_PATH } = require("../utils/backend_paths.js");

const {
  analyzeInventory,
  selectRecipesUnderBudget,
  calculateShoppingAndExpiring,
  normalizeScores,
} = require("../utils/groceryUtils.js");
const {
  calculateRecipeMetrics,
  calculateShoppingListCost,
} = require("../utils/api.js");
const {
  GENERATE_CONSTANTS,
  ALGORITHM_WEIGHTS,
  FALLBACK_METRICS,
} = require("../utils/groceryConstants.js");

// Generate three optimized grocery lists, based on user budget and inventory
const groceryRecommendation = async (userId, preferences, inventory) => {
  const { budget, allowRepeats = false, maxRepeats = 1 } = preferences;

  try {
    // Generate all three meal plans
    const mealPlan = await generateMealPlans(
      userId,
      budget,
      inventory,
      allowRepeats,
      maxRepeats
    );

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
const generateMealPlans = async (
  userId,
  budget,
  inventory,
  allowRepeats = false,
  maxRepeats = 1
) => {
  try {
    // Call recipe recommendation system to get base recipes
    const response = await axios.get(
      `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
      {
        params: {
          ingredientType: "partial",
          maxMissing: GENERATE_CONSTANTS.MAX_MISSING,
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
          cost: FALLBACK_METRICS.COST,
          inventoryUsage: FALLBACK_METRICS.INVENTORY_USAGE,
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
      userId,
      allowRepeats,
      maxRepeats
    );

    // Generates grocery list optimized for inventory usage
    const inventoryMaximized = await generateInventoryMaximized(
      recipesWithMetrics,
      budget,
      inventory,
      userId,
      allowRepeats,
      maxRepeats
    );

    // Generates grocery list optimized for recipe complexity
    const complexityMaximized = await generateComplexityMaximized(
      recipesWithMetrics,
      budget,
      inventory,
      userId,
      allowRepeats,
      maxRepeats
    );

    const bestOverall = await generateBestOverall(
      recipesWithMetrics,
      budget,
      inventory,
      userId,
      allowRepeats,
      maxRepeats
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
  userId,
  allowRepeats = false,
  maxRepeats = 1
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

  let selectedRecipes = [];
  let totalCost = 0;
  let remainingBudget = budget;
  let usedInventory = new Set();
  if (!allowRepeats) {
    // Get as many recipes as fit in budget
    const result = selectRecipesUnderBudget(budgetOptimized, budget);
    selectedRecipes = result.validRecipes;
    remainingBudget = result.remainingBudget;
    totalCost = budget - remainingBudget;
    usedInventory = result.usedInventory;
  } else {
    const { recipes: finalRecipes, cost: finalCost } = selectRecipesWithRepeats(
      budgetOptimized,
      budget,
      maxRepeats
    );
    selectedRecipes = finalRecipes;
    totalCost = finalCost;
    remainingBudget = budget - totalCost;
    // Calculate used inventory for repeated recipes
    selectedRecipes.forEach((recipe) => {
      if (recipe.ownedIngredients) {
        recipe.ownedIngredients.forEach((ingredient) => {
          usedInventory.add(ingredient.name);
        });
      }
    });
  }

  // Generate grocery list with costs
  const groceryList = await generateGroceryList(
    selectedRecipes,
    inventory,
    userId
  );

  return {
    type: "Budget Maximizer",
    recipes: selectedRecipes,
    totalCost: Number(totalCost.toFixed(2)),
    mealsCount: selectedRecipes.length,
    avgCostPerMeal:
      selectedRecipes.length > 0
        ? Number((totalCost / selectedRecipes.length).toFixed(2))
        : 0,
    budgetUtilization: Number((totalCost / budget).toFixed(2)),
    groceryList,
    avgRecipeInventoryUsage:
      selectedRecipes.length > 0
        ? Number(
            selectedRecipes.reduce(
              (sum, recipe) => sum + (recipe.inventoryUsage || 0),
              0
            ) / selectedRecipes.length
          )
        : 0,
    budgetRemaining: Number(remainingBudget.toFixed(2)),
    allowRepeats,
    maxRepeats: allowRepeats ? maxRepeats : 1,
  };
};

// Generates grocery list that maximizes usage of inventory
// Prioritizes high inventory usage, then fewest missing ingredients
const generateInventoryMaximized = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId,
  allowRepeats = false,
  maxRepeats = 1
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

  let selectedRecipes = [];
  let totalCost = 0;
  let remainingBudget = budget;
  let usedInventory = new Set();
  if (!allowRepeats) {
    // Get as many recipes as fit in budget
    const result = selectRecipesUnderBudget(inventoryOptimized, budget);
    selectedRecipes = result.validRecipes;
    remainingBudget = result.remainingBudget;
    usedInventory = result.usedInventory;
    totalCost = budget - remainingBudget;
  } else {
    const { recipes: finalRecipes, cost: finalCost } = selectRecipesWithRepeats(
      inventoryOptimized,
      budget,
      maxRepeats
    );
    selectedRecipes = finalRecipes;
    totalCost = finalCost;
    remainingBudget = budget - totalCost;
    // Calculate used inventory for repeated recipes
    selectedRecipes.forEach((recipe) => {
      if (recipe.ownedIngredients) {
        recipe.ownedIngredients.forEach((ingredient) => {
          usedInventory.add(ingredient.name);
        });
      }
    });
  }

  // Generate grocery list with costs
  const groceryList = await generateGroceryList(
    selectedRecipes,
    inventory,
    userId
  );
  return {
    type: "Inventory Maximizer",
    recipes: selectedRecipes,
    totalCost: Number(totalCost.toFixed(2)),
    mealsCount: selectedRecipes.length,
    avgCostPerMeal:
      selectedRecipes.length > 0
        ? Number((totalCost / selectedRecipes.length).toFixed(2))
        : 0,
    avgRecipeInventoryUsage:
      selectedRecipes.length > 0
        ? Number(
            selectedRecipes.reduce(
              (sum, recipe) => sum + (recipe.inventoryUsage || 0),
              0
            ) / selectedRecipes.length
          )
        : 0,
    groceryList,
    inventoryItemsUsed: usedInventory.size,
    budgetRemaining: Number(remainingBudget.toFixed(2)),
    allowRepeats,
    maxRepeats: allowRepeats ? maxRepeats : 1,
  };
};

// Generates grocery list that maximizes complexity of recipes
// Prioritizes highest total ingredients, then longest prep time
const generateComplexityMaximized = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId,
  allowRepeats = false,
  maxRepeats = 1
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

  let selectedRecipes = [];
  let totalCost = 0;
  let remainingBudget = budget;
  let usedInventory = new Set();
  if (!allowRepeats) {
    // Get as many recipes as fit in budget
    const result = selectRecipesUnderBudget(complexityOptimized, budget);
    selectedRecipes = result.validRecipes;
    remainingBudget = result.remainingBudget;
    totalCost = budget - remainingBudget;
    usedInventory = result.usedInventory;
  } else {
    const { recipes: finalRecipes, cost: finalCost } = selectRecipesWithRepeats(
      complexityOptimized,
      budget,
      maxRepeats
    );
    selectedRecipes = finalRecipes;
    totalCost = finalCost;
    remainingBudget = budget - totalCost;
    // Calculate used inventory for repeated recipes
    selectedRecipes.forEach((recipe) => {
      if (recipe.ownedIngredients) {
        recipe.ownedIngredients.forEach((ingredient) => {
          usedInventory.add(ingredient.name);
        });
      }
    });
  }

  // Generate grocery list with costs
  const groceryList = await generateGroceryList(
    selectedRecipes,
    inventory,
    userId
  );

  return {
    type: "Complexity Maximizer",
    recipes: selectedRecipes,
    totalCost: Number(totalCost.toFixed(2)),
    mealsCount: selectedRecipes.length,
    avgIngredientsPerMeal:
      selectedRecipes.length > 0
        ? Math.ceil(
            selectedRecipes.reduce((sum, r) => sum + r.numTotalIngredients, 0) /
              selectedRecipes.length
          )
        : 0,
    groceryList,
    avgRecipeInventoryUsage:
      selectedRecipes.length > 0
        ? Number(
            selectedRecipes.reduce(
              (sum, recipe) => sum + (recipe.inventoryUsage || 0),
              0
            ) / selectedRecipes.length
          )
        : 0,
    budgetRemaining: Number(remainingBudget.toFixed(2)),
    allowRepeats,
    maxRepeats: allowRepeats ? maxRepeats : 1,
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

// Generates "best overall" grocery list that combines all 3 approaches
const generateBestOverall = async (
  recipesWithMetrics,
  budget,
  inventory,
  userId,
  allowRepeats = false,
  maxRepeats = 1
) => {
  let selectedRecipes = [];
  let totalCost = 0;
  let groceryList = {};
  let usedInventory = new Set();
  try {
    const maxValues = normalizeScores(recipesWithMetrics);
    const recipesWithScores = recipesWithMetrics.map((recipe) => {
      const scores = calculateRecipeScores(recipe, maxValues);
      const totalScore =
        scores.budget * ALGORITHM_WEIGHTS.BUDGET +
        scores.inventory * ALGORITHM_WEIGHTS.INVENTORY +
        scores.complexity * ALGORITHM_WEIGHTS.COMPLEXITY;
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

    if (!allowRepeats) {
      for (const recipe of sortedRecipes) {
        const recipeCost = recipe.cost || 0;
        if (totalCost + recipeCost <= budget) {
          selectedRecipes.push(recipe);
          totalCost += recipeCost;
        }
      }
    } else {
      const { recipes: finalRecipes, cost: finalCost } =
        selectRecipesWithRepeats(sortedRecipes, budget, maxRepeats);
      selectedRecipes = finalRecipes;
      totalCost = finalCost;
    }
    // Calculate used inventory for repeated recipes
    selectedRecipes.forEach((recipe) => {
      if (recipe.ownedIngredients) {
        recipe.ownedIngredients.forEach((ingredient) => {
          usedInventory.add(ingredient.name);
        });
      }
    });

    groceryList = await generateGroceryList(selectedRecipes, inventory, userId);
  } catch (err) {
    throw err;
  }

  return {
    type: "Best Overall",
    recipes: selectedRecipes,
    totalCost: Number(totalCost.toFixed(2)),
    mealsCount: selectedRecipes.length,
    avgCostPerMeal:
      selectedRecipes.length > 0
        ? Number((totalCost / selectedRecipes.length).toFixed(2))
        : 0,
    budgetUtilization: Number((totalCost / budget).toFixed(2)),
    budgetUsed: Number(((totalCost / budget) * 100).toFixed(1)),
    budgetRemaining: Number((budget - totalCost).toFixed(2)),
    avgRecipeInventoryUsage:
      selectedRecipes.length > 0
        ? Number(
            selectedRecipes.reduce(
              (sum, recipe) => sum + (recipe.inventoryUsage || 0),
              0
            ) / selectedRecipes.length
          )
        : 0,
    groceryList,
    allowRepeats,
    maxRepeats: allowRepeats ? maxRepeats : 1,
  };
};

const selectRecipesWithRepeats = (sortedRecipes, budget, maxRepeats) => {
  const selectedRecipes = [];
  const recipeFrequencies = new Map();
  let totalCost = 0;
  // Keep adding best recipe until we can't afford it, or reach max repeats
  while (totalCost < budget) {
    let addedRecipe = false;
    for (const recipe of sortedRecipes) {
      const recipeCost = recipe.cost || 0;
      const currentFrequency = recipeFrequencies.get(recipe.id) || 0;
      if (totalCost + recipeCost <= budget && currentFrequency < maxRepeats) {
        selectedRecipes.push({
          ...recipe,
          repeatNumber: currentFrequency + 1,
          recipeId: `${recipe.id}-${currentFrequency + 1}`,
        });
        recipeFrequencies.set(recipe.id, currentFrequency + 1);
        totalCost += recipeCost;
        addedRecipe = true;
        break;
      }
    }

    // If we couldn't add any recipe, done searching
    if (!addedRecipe) {
      break;
    }
  }
  return { recipes: selectedRecipes, cost: totalCost };
};

module.exports = {
  groceryRecommendation,
  generateMealPlans,
  calculateShoppingAndExpiring,
  calculateShoppingListCost,
};
