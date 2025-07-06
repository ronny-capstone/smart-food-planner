import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";

export default function FoodItemForm({ handleItemAdded }) {
  const [foodItem, setFoodItem] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (foodItem.trim() === "") {
      alert("Please fill out all fields.");
      return;
    }

    try {
      fetch(`${API_BASE_URL}/food/search?query=${encodeURIComponent(foodItem)}`)
        .then((response) => {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            throw new Error("Unexpected response format");
          }
        })
        .then((data) => {
          if (data.results && data.results.length > 0) {
            const searchResults = data.results.map((item) => {
              return {
                id: item.id,
                name: item.name,
                image: item.image || null,
              };
            });
            handleItemAdded(searchResults);
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    } catch (err) {
      console.log("Failed to submit form:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h1>Add New Food Item</h1>

        <div>
          <div>
            <label>Food item:</label>
            <input
              name="foodItem"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
            />
          </div>
          <div>
            <button type="submit">Submit</button>
          </div>
        </div>
      </div>
    </form>
  );
}
