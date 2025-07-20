const fs = require("fs").promises;

const exportGroceries = async (groceryListText) => {
  const date = new Date().toISOString().split("T")[0];
  const fileName = `GroceryList-${date}.txt`;
  try {
    await fs.writeFile(fileName, groceryListText, "utf8");
    const data = await fs.readFile(fileName, "utf8");
    return { fileName, data };
  } catch (err) {
    console.log("Error writing files: ", err);
  }
};

module.exports = { exportGroceries };
