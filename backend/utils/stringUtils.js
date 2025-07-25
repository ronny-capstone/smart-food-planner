const isNameMatch = (ingredient, inventoryItem) => {
  const ingredientName = ingredient.name.toLowerCase();
  const inventoryName = inventoryItem.name.toLowerCase();

  // Exact match
  if (ingredientName === inventoryName) {
    return true;
  }

  // Check for plurals
  if (
    ingredientName + "s" === inventoryName ||
    inventoryName + "s" === ingredientName
  ) {
    return true;
  }

  return false;
};

const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports = { capitalize, isNameMatch };
