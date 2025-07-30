const { DIETS } = require("./recipeConstants.js");
const { getDaysUntilExpiration } = require("./dateUtils.js");

const dietMatch = (recipe, userDiet) => {
  const diet = userDiet.toLowerCase();
  if (diet === DIETS.VEGAN) {
    return recipe.vegan;
  }
  if (diet === DIETS.VEGETARIAN) {
    return recipe.vegetarian;
  }
  if (diet === DIETS.GLUTEN_FREE) {
    return recipe.glutenFree;
  }
  if (diet === DIETS.KETOGENIC) {
    return recipe.ketogenic;
  }
  return true;
};

const filterRecipesByMealType = (recipes, mealType) => {
  if (mealType === "breakfast") {
    // Only return recipes that explicitly have breakfast dish types
    return recipes.filter(
      (recipe) =>
        recipe.dishTypes &&
        recipe.dishTypes.some((dishType) =>
          dishType.toLowerCase().includes("breakfast")
        )
    );
  }
  // For lunch/dinner, use all non-breakfast recipes
  const remainingRecipes = recipes.filter((recipe) => {
    if (!recipe.dishTypes || recipe.dishTypes.length === 0) {
      return true; // Include recipes without dish types
    }
    // Exclude recipes that are explicitly breakfast
    return !recipe.dishTypes.some((dishType) =>
      dishType.toLowerCase().includes("breakfast")
    );
  });

  // Distribute remaining recipes between lunch and dinner
  if (mealType === "lunch") {
    return remainingRecipes.filter((recipe, index) => index % 2 === 0);
  } else if (mealType === "dinner") {
    return remainingRecipes.filter((recipe, index) => index % 2 === 1);
  }
  return [];
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const copyArray = (array, desiredLength) => {
  if (array.length === 0) {
    return [];
  }
  const extendedArray = [];
  for (let i = 0; i < desiredLength; i++) {
    extendedArray.push(array[i % array.length]);
  }
  return extendedArray;
};

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Helper to get expiring items
const getExpiringItems = (inventory, daysUntilExpire) => {
  return inventory
    .filter(
      (item) =>
        getDaysUntilExpiration(item.expiration_date) <= daysUntilExpire &&
        getDaysUntilExpiration(item.expiration_date) >= 0
    )
    .sort((a, b) => {
      return (
        getDaysUntilExpiration(a.expiration_date) -
        getDaysUntilExpiration(b.expiration_date)
      );
    });
};

module.exports = {
  dietMatch,
  shuffleArray,
  copyArray,
  filterRecipesByMealType,
  dayNames,
  getExpiringItems,
};
