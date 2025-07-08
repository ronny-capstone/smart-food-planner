import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { GROCERY_PATH, FOOD_PATH } from "../utils/paths";

export default function GroceryForm({
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

  const addGrocery = () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );
    if (!selectedFood) {
      alert("Please select a valid food item");
      return;
    }
    try {
      fetch(`${API_BASE_URL}${GROCERY_PATH}`, {
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
          console.log("Failed to add grocery item:", err.message);
        });
    } catch (err) {
      console.log("Failed to add grocery item:", err.message);
    }
  };

  const updateGrocery = () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );

    try {
      fetch(`${API_BASE_URL}${GROCERY_PATH}/${groceryToUpdate.id}`, {
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
          console.log("Failed to update grocery item:", err);
        });
    } catch (err) {
      console.log("Failed to update grocery item:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (foodItem === "" || quantity === "" || expirationDate === "") {
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
    <form onSubmit={handleSubmit}>
      <div>
        {type === "add" && <h1>Add to Grocery List</h1>}
        {type === "update" && <h1>Update Grocery Item</h1>}

        <div>
          <label>Food item:</label>
          {foodItems.length === 0 ? (
            <p> No food items available. Please add some food items first </p>
          ) : (
            <select
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
        <div>
          <label>Quantity:</label>
          <input
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 1, 2, 5"
          />
        </div>
        <div>
          <label>Expiration date:</label>
          <input
            name="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>
        <div>
          <button type="submit">
            {type === "add" ? "Add to grocery list" : "Update item"}
          </button>
        </div>
      </div>
    </form>
  );
}
