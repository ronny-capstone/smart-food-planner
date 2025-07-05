import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";

export default function GroceryForm({
  handleGroceryAdded,
  handleGroceryUpdated,
  setShowModal,
  type,
  groceryToUpdate,
}) {
  const [foodItem, setFoodItem] = useState("");
  const [quantity, setQuantity] = useState("");
  // Set default expiration date to today
  const [expirationDate, setExpirationDate] = useState(new Date().toISOString().split("T")[0]);
  const [foodItems, setFoodItems] = useState([]);
  const FOOD_PATH = "/food";
  const GROCERY_PATH = "/grocery";

  // Fetch food items for dropdown options
  useEffect(() => {
    fetch(`${API_BASE_URL}${FOOD_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setFoodItems(data);
      })
      .catch((err) => {
        console.log("Failed to fetch food items:", err);
        setFoodItems([]);
      });
  }, []);

  // Update expiration estimate when food item changes
  useEffect(() => {
    if (type === "update" && groceryToUpdate) {
      setFoodItem(groceryToUpdate.item_id.toString());
      setQuantity(groceryToUpdate.quantity.toString());
      setExpirationDate(groceryToUpdate.expiration_date);
    }
  }, [type, groceryToUpdate]);

  const addGrocery = async () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );
    if (!selectedFood) {
      alert("Please select a valid food item");
      return;
    }
    try {
      await fetch(`${API_BASE_URL}${GROCERY_PATH}`, {
        method: "POST",
        body: JSON.stringify({
          // TODO: handle user_id
          user_id: 1,
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
          console.log("Failed to add grocery item:", err.message);
        });
    } catch (err) {
      console.log("Failed to add grocery item:", err.message);
    }
  };

  const updateGrocery = async () => {
    try {
      await fetch(`${API_BASE_URL}${GROCERY_PATH}/${groceryToUpdate.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: parseInt(quantity),
          expiration_date: expirationDate,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleGroceryUpdated(data);
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to update grocery item:", err);
        });
    } catch (err) {
      console.log("Failed to update grocery item:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      foodItem.trim() === "" ||
      quantity.trim() === "" ||
      expirationDate.trim() === ""
    ) {
      alert("Please fill out all fields.");
      return;
    }
    if (
      !Number.isInteger(parseInt(foodItem)) ||
      !Number.isInteger(parseInt(quantity)) ||
      parseInt(quantity) <= 0
    ) {
      alert("Please select a food item and enter a positive quantity.");
      return;
    }
    if (type === "add") {
      addGrocery();
    } else if (type === "update") {
      updateGrocery();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-start p-6 bg-gray-50">
        {type === "add" && (
          <h1 className="text-xl font-bold mb-6">Add to Grocery List</h1>
        )}
        {type === "update" && (
          <h1 className="text-xl font-bold mb-6">Update Grocery Item</h1>
        )}

        <div className="mb-4 w-full max-w-sm">
          <label className="block mb-1 font-medium">Food item:</label>
          {foodItems.length === 0 ? (
            <p> No food items available. Please add some food items first </p>
          ) : (
            <select
              className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
              name="foodItem"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
            >
              <option value=""> Select a food item </option>
              {foodItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="mb-4 w-full max-w-sm">
          <label className="block mb-1 font-medium"> Quantity: </label>
          <input
            className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 1, 2, 5"
          />
        </div>
        <div className="mb-4 w-full max-w-sm">
          <label className="block mb-1 font-medium"> Expiration date:</label>
          <input
            className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
            name="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>
        <div className="mb-1 w-full max-w-sm">
          <button
            type="submit"
            className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 transition mb-2"
          >
            {type === "add" ? "Add to grocery list" : "Update item"}
          </button>
        </div>
      </div>
    </form>
  );
}
