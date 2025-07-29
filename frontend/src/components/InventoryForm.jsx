import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { INVENTORY_PATH, FOOD_PATH } from "../utils/paths";
import { toast } from "react-toastify";
import FoodItemForm from "./FoodItemForm";
import {
  NO_NUTRIENT_FOUND,
  NUTRIENT_NAMES,
  TYPES,
} from "../utils/groceryConstants";

export default function InventoryForm({
  handleGroceryAdded,
  handleGroceryUpdated,
  setShowModal,
  type,
  groceryToUpdate,
  currentUser,
}) {
  const [foodItem, setFoodItem] = useState("");
  const [quantity, setQuantity] = useState("");
  // Set default expiration date to today
  const [expirationDate, setExpirationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [foodItems, setFoodItems] = useState([]);
  const [showFoodItemForm, setShowFoodItemForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch food items for dropdown options
  useEffect(() => {
    fetch(`${API_BASE_URL}${FOOD_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setFoodItems(data);
      })
      .catch((err) => {
        toast.error("Unable to load food items˝");
        setFoodItems([]);
      });
  }, []);

  // Update expiration estimate when food item changes
  useEffect(() => {
    if (type === TYPES.UPDATE && groceryToUpdate) {
      setFoodItem(groceryToUpdate.item_id.toString());
      setQuantity(groceryToUpdate.quantity.toString());
      setExpirationDate(groceryToUpdate.expiration_date);
    }
  }, [type, groceryToUpdate]);

  const handleFoodItemChange = (e) => {
    const value = e.target.value;
    if (value === TYPES.ADD) {
      setShowFoodItemForm(true);
    } else {
      setFoodItem(value);
      setShowFoodItemForm(false);
      setSearchResults([]);
    }
  };

  const handleItemAdded = (results) => {
    setSearchResults(results);
  };

  const getNutrient = (nutrients, name) => {
    const nutrient = nutrients.find((n) => n.name === name);
    return nutrient ? nutrient.amount : NO_NUTRIENT_FOUND;
  };

  const handleSelectSearchResult = async (selectedItem) => {
    try {
      // Get nutritional information for the chosen item
      fetch(`${API_BASE_URL}/food/nutrition?itemId=${selectedItem.id}&amount=1`)
        .then((response) => {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            throw new Error("unexpected response format");
          }
        })
        .then((data) => {
          const newFoodItem = {
            spoonacular_id: data.id,
            name: data.name,
            calories: getNutrient(
              data.nutrition.nutrients,
              NUTRIENT_NAMES.CALORIES
            ),
            protein: getNutrient(
              data.nutrition.nutrients,
              NUTRIENT_NAMES.PROTEIN
            ),
            carbs: getNutrient(data.nutrition.nutrients, NUTRIENT_NAMES.CARBS),
            fats: getNutrient(data.nutrition.nutrients, NUTRIENT_NAMES.FATS),
            sugars: getNutrient(data.nutrition.nutrients, NUTRIENT_NAMES.SUGAR),
          };

          // Try to add to database with duplicate handling
          fetch(`${API_BASE_URL}/food`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newFoodItem),
          })
            .then((res) => {
              if (res.status === 409) {
                return res.json().then((err) => {
                  toast.warning("Duplicate food item: ", err.existingItem.name);
                  throw new Error("Duplicate handled");
                });
              }
              return res.json();
            })
            .then((data) => {
              setFoodItems((prev) => [...prev, data]);
              setFoodItem(data.id.toString());
              setShowFoodItemForm(false);
              setSearchResults([]);
              toast.success(`${selectedItem.name} added to food items!`);
            })
            .catch((err) => {
              console.log(err.message);
              toast.error(`Failed to add food item`);
            });
        })
        .catch((err) => {
          console.log(err.message);
          toast.error(`Failed to add food item`);
        });
    } catch (err) {
      console.log("Failed to fetch info:", err.message, err);
    }
  };

  const addGrocery = () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );
    if (!selectedFood) {
      toast.error("Please select a valid food item");
      return;
    }
    try {
      fetch(`${API_BASE_URL}${INVENTORY_PATH}`, {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUser,
          item_id: parseInt(foodItem),
          name: selectedFood.name,
          quantity: parseInt(quantity),
          expiration_date: expirationDate,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleGroceryAdded(data);
          // Reset form
          setFoodItem("");
          setQuantity("");
          setExpirationDate("");
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to add food item:", err.message);
        });
    } catch (err) {
      console.log("Failed to add food item:", err.message);
    }
  };

  const updateGrocery = () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );

    try {
      fetch(`${API_BASE_URL}${INVENTORY_PATH}/${groceryToUpdate.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: parseInt(quantity),
          expiration_date: expirationDate,
          item_id: parseInt(foodItem),
          name: selectedFood.name,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleGroceryUpdated(data);
          // Reset form
          setFoodItem("");
          setQuantity("");
          setExpirationDate("");
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to update food item:", err);
        });
    } catch (err) {
      console.log("Failed to update food item:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (foodItem === "" || quantity === "" || expirationDate === "") {
      toast.error("Please fill out all fields.");
      return;
    }
    if (
      !Number.isInteger(parseInt(foodItem)) ||
      !Number.isInteger(parseInt(quantity)) ||
      parseInt(quantity) <= 0
    ) {
      toast.error("Please select a food item and enter a positive quantity.");
      return;
    }
    if (type === TYPES.ADD) {
      addGrocery();
    } else if (type === TYPES.UPDATE) {
      updateGrocery();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl">
        {type === TYPES.ADD && (
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Add to Inventory
          </h1>
        )}
        {type === TYPES.UPDATE && (
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Update Food Item
          </h1>
        )}

        <div>
          <label>Food item:</label>
          {foodItems.length === 0 ? (
            <p className="font-medium">
              No food items available. Please add some food items first
            </p>
          ) : (
            <>
              <select
                name="foodItem"
                value={showFoodItemForm ? TYPES.ADD : foodItem}
                onChange={handleFoodItemChange}
                className="py-2 border border-gray-300 rounded-lg ml-2"
              >
                <option value="">Select a food item</option>
                <option value="add">+ Add new food item</option>
                {foodItems
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>

              {/* Show FoodItemForm and search results if needed */}
              {showFoodItemForm && (
                <>
                  <FoodItemForm handleItemAdded={handleItemAdded} />
                  {/* Show search results as a list of buttons */}
                  {searchResults.length > 0 && (
                    <div>
                      <h4>Select a food item:</h4>
                      {searchResults.map((result) => (
                        <div key={result.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSearchResult(result)}
                          >
                            {result.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {/* Only show these fields if not adding a new food item */}
        {!showFoodItemForm && (
          <>
            <div className="mb-2">
              <label>Quantity:</label>
              <input
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1, 2, 5"
                className="ml-2"
              />
            </div>
            <div className="mb-2">
              <label>Expiration date:</label>
              <input
                name="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="ml-2"
              />
            </div>
          </>
        )}
        <div className="mt-4 mb-1">
          <button
            type="submit"
            className="!bg-emerald-50"
            disabled={showFoodItemForm}
          >
            {type === TYPES.ADD ? "Add to inventory" : "Update item"}
          </button>
        </div>
      </div>
    </form>
  );
}
