import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH } from "../utils/paths";
import {
  GENERATE_PATH,
  GROCERY_LIST_PATH,
  GROCERY_PATH,
  EXPORT_PATH,
} from "../utils/paths";
import { listToString } from "../utils/listToString";
import { capitalize, isNameMatch } from "../utils/stringUtils";
import { toast } from "react-toastify";

export default function GroceryRecForm({ currentUser }) {
  const [form, setForm] = useState({
    result: null,
    noResults: false,
    isSearching: false,
    diet: "",
    budget: 20,
    useDiet: true,
    isAddingToList: false,
  });

  // Fetch user's diet from profile
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    // Get current user's profile, if exists
    fetch(`${API_BASE_URL}${PROFILE_PATH}/${currentUser}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Profile not found");
        }
      })
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          useDiet: true,
          diet: data.profile.dietary_preferences,
        }));
      })
      .catch((err) => {
        setForm((prev) => ({ ...prev, useDiet: false, diet: "" }));
      });
  }, [currentUser]);

  const clearResults = () => {
    setForm((prev) => ({
      ...prev,
      result: null,
      noResults: false,
    }));
  };

  const clearForm = () => {
    setForm((prev) => ({
      ...prev,
      isSearching: false,
      diet: "",
      budget: 20,
      useDiet: true,
      result: null,
    }));
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleExport = (groceryListText) => {
    fetch(`${API_BASE_URL}${GROCERY_LIST_PATH}${EXPORT_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groceryListText }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Export failed");
        }
      })
      .then(({ fileName, data }) => {
        // Create blob with data
        const blob = new Blob([data], { type: "text/plain" });
        // Create temporary URL that points to blob
        const url = URL.createObjectURL(blob);
        // Create temporary anchor element to trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        // Click anchor to start download
        a.click();
        // Clean up by removing temporary URL
        URL.revokeObjectURL(url);
        toast.success("Grocery list exported!");
      })
      .catch((err) => {
        toast.error("Failed to export grocery list");
      });
  };

  // Add generated grocery list items to user's grocery list with duplicate checking
  const handleAddToGroceryList = async (shoppingList) => {
    if (!shoppingList || shoppingList.length === 0) {
      toast.info("No items to add to grocery list");
      return;
    }
    setForm((prev) => ({ ...prev, isAddingToList: true }));

    try {
      // Fetch existing grocery list items
      const response = await fetch(
        `${API_BASE_URL}${GROCERY_PATH}?user_id=${currentUser}`
      );
      const existingItems = await response.json();
      console.log("Shopping list: ", shoppingList);
      console.log("Existing items: ", existingItems);
      let processedCount = 0;
      let successCount = 0;

      shoppingList.forEach(async (item) => {
        try {
          if (!item || !item.name) {
            console.log("Skipping  item with missing name:", item);
            processedCount++;
            return;
          }

          let existingItem = null;
          if (item.id) {
            existingItem = existingItems.find(
              (existing) => existing.id === item.id
            );
          }

          if (existingItem) {
            // If item exists, combine quantities
            await fetch(`${API_BASE_URL}${GROCERY_PATH}/${existingItem.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                quantity: existingItem.quantity + item.quantity,
              }),
            });
            successCount++;
          } else {
            // If item does not exist, create new
            await fetch(`${API_BASE_URL}${GROCERY_PATH}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: currentUser,
                item_id: item.id || 0,
                name: item.name,
                quantity: item.quantity,
              }),
            });
            successCount++;
          }
        } catch (err) {
          console.log(`Error processing ${item.name}`, err);
        }

        processedCount++;
        if (processedCount === shoppingList.length) {
          if (successCount > 0) {
            toast.success(
              `Successfully added ${successCount} items to your grocery list!`
            );
          } else {
            toast.error(
              `Failed to add items to grocery list. Please try again.`
            );
          }
          setForm((prev) => ({ ...prev, isAddingToList: false }));
        }
      });
    } catch (err) {
      toast.error("Failed to process grocery list items");
      setForm((prev) => ({ ...prev, isAddingToList: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, isSearching: true, noResults: false }));
    const params = new URLSearchParams({
      budget: form.budget,
    });

    try {
      fetch(
        `${API_BASE_URL}${GROCERY_LIST_PATH}${GENERATE_PATH}/${currentUser}?${params}`
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          setForm((prev) => ({
            ...prev,
            result: data,
            noResults: false,
            isSearching: false,
          }));
          toast.success("Grocery list recommendations generated!");
        })
        .catch((err) => {
          toast.error("Failed to get grocery list recommendations");
          setForm((prev) => ({ ...prev, noResults: true, isSearching: false }));
        });
    } catch (err) {
      toast.error("Failed to get grocery list recommendations");
      setForm((prev) => ({ ...prev, noResults: true, isSearching: false }));
    }
  };

  return (
    <div>
      <h1>Grocery List Generator</h1>
      <p>Get personalized grocery recommendations</p>
      <div>
        <label>Budget: $</label>
        <input
          type="number"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          min="1"
          required
        ></input>
      </div>

      <div className="mb-1 w-full max-w-sm">
        <button type="button" onClick={clearForm}>
          Clear Filters
        </button>
      </div>

      {form.result && (
        <button type="button" onClick={clearResults}>
          Clear Results
        </button>
      )}

      <div className="mb-1 w-full max-w-sm">
        <button type="submit" onClick={handleSubmit}>
          Generate Grocery List
        </button>
      </div>

      {form.result?.types && !form.noResults && (
        <div>
          <h2>Grocery List Strategies</h2>
          {[
            "bestOverall",
            "budgetMaximizer",
            "inventoryMaximizer",
            "complexityMaximizer",
          ].map((type) => {
            const groceryType = form.result.types[type];
            if (!groceryType) {
              return null;
            }
            const groceryList = groceryType.groceryList || {};

            const types = {
              bestOverall: {
                title: "Best Overall",
                text: "Optimal balance of cost and convenience!",
              },
              budgetMaximizer: {
                title: "Budget Maximizer",
                text: "Maximize your budget!",
              },
              inventoryMaximizer: {
                title: "Inventory Maximizer",
                text: "Use up your inventory!",
              },
              complexityMaximizer: {
                title: "Complexity Maximizer",
                text: "Make rich & complex recipes!",
              },
            };

            return (
              <div key={type} className="mb-8 p-4 border rounded">
                <h3>{types[type].title}</h3>
                <p>{types[type].text}</p>
                <p>
                  Total cost: ${Number(groceryType.totalCost).toFixed(2)} out of
                  ${form.budget} budget
                </p>
                <p>Budget Used: {groceryType.budgetUsed}%</p>
                <p>Meals planned: {groceryType.mealsCount}</p>

                {groceryType.inventoryUtilization !== undefined && (
                  <p>
                    Inventory Usage:{" "}
                    {Math.round(groceryType.inventoryUtilization * 100)}%
                  </p>
                )}

                {groceryType.recipes?.length > 0 && (
                  <div>
                    <h4>Meal Plan:</h4>
                    {groceryType.recipes.map((meal, index) => (
                      <div key={index}>
                        <p>
                          Meal {index + 1}: {meal.title}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {groceryList.shoppingList?.length > 0 ? (
                  <div>
                    <h4>Shopping List:</h4>
                    <p>Items to buy: {groceryList.itemsNeeded}</p>
                    <div>
                      {groceryList.shoppingList.map((item, index) => (
                        <div key={index}>
                          <p>
                            {capitalize(item.name)} - {item.quantity}{" "}
                            {item.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No items needed - you have everything!</p>
                )}
                {groceryList?.inventoryRecommendations?.length > 0 && (
                  <div>
                    <p>While you're at the store, you may want to buy: </p>
                    {groceryList.inventoryRecommendations.map((item, index) => (
                      <div
                        key={index}
                        className={`border p-3 rounded ${
                          item.type === "expiring-replacement"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p>{capitalize(item.name)}</p>
                        <p>{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <button
                    onClick={() =>
                      handleExport(
                        listToString(
                          groceryList.shoppingList,
                          groceryList.inventoryRecommendations
                        )
                      )
                    }
                  >
                    Export grocery list
                  </button>
                </div>

                {groceryList.shoppingList?.length > 0 && (
                  <button
                    onClick={() =>
                      handleAddToGroceryList(groceryList.shoppingList)
                    }
                  >
                    Add to grocery list
                  </button>
                )}
              </div>
            );
          })}

          {/* {form.isAddingToList && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <p className="text-lg font-medium text-gray-700">
                Adding items to grocery list...
              </p>
              <img
                src="/infinityLoading.gif"
                alt="Loading"
                className="w-32 h-32"
              />
            </div>
          )} */}
          {form.isSearching && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <p className="text-lg font-medium text-gray-700">
                Generating grocery list...
              </p>
              <img
                src="/infinityLoading.gif"
                alt="Loading"
                className="w-32 h-32"
              />
            </div>
          )}

          {form.noResults && !form.isSearching && (
            <div>
              <p> Grocery list could not be generated. </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
