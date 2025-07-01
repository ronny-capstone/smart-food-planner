import { useState, useEffect } from "react";

export default function FoodItemForm({ setShowModal }) {
  const [dateLogged, setDateLogged] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [foodItem, setFoodItem] = useState("");
  const [results, setResults] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (foodItem.trim() === "") {
      alert("Please fill out all fields.");
      return;
    }
    setResults([]);
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    try {
      fetch(`${baseUrl}/food?query=${encodeURIComponent(foodItem)}`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log(data);
          console.log(data.results);
          setResults(data.results || []);
        })
        .catch((err) => {
          console.log(err.message);
        });
    } catch (err) {
      console.log("Failed to submit form:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-start p-6 bg-gray-50">
        <h1 className="text-xl font-bold mb-6">Add New Food Item</h1>

        <div className="mb-4 w-full max-w-sm">
          <div className="mb-4 w-full max-w-sm">
            <label className="block mb-1 font-medium">Food item:</label>
            <input
              className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
              name="foodItem"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
            />
          </div>
          <div className="mb-1 w-full max-w-sm">
            <button
              type="submit"
              className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 transition mb-2"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
