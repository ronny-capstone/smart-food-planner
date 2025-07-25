export const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const formatServings = (servings) => {
  const servingsString = servings === 1 ? "serving" : "servings";
  return `${Math.abs(servings)} ${servingsString}`;
};
