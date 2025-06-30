import { useState } from "react";
import { API_BASE_URL } from "../utils/api";
export default function LogForm({ handleLogAdded, setShowModal, type }) {
  const [userId, setUserId] = useState();
  const [dateLogged, setDateLogged] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [foodItem, setFoodItem] = useState("");
  const [servings, setServings] = useState("");

  const handleSubmit = async (e) => {
    if (type === "add") {
      e.preventDefault();
      if (foodItem.trim() === "" || servings.trim() === "") {
        alert("Please fill out all fields.");
        return;
      }
      if (
        !Number.isInteger(parseInt(foodItem)) ||
        !Number.isInteger(parseInt(servings)) ||
        parseInt(servings) <= 0
      ) {
        alert("Please enter a positive number for servings.");
        return;
      }

      try {
        await fetch(`${API_BASE_URL}/log`, {
          method: "POST",
          body: JSON.stringify({
            user_id: 1,
            date_logged: dateLogged,
            item_id: parseInt(foodItem),
            servings: parseInt(servings),
          }),
          headers: {
            "Content-type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            handleLogAdded(data);
            setDateLogged("");
            setFoodItem("");
            setServings("");
          })
          .catch((err) => {
            console.log("Failed to create log:", err);
          });
      } catch (err) {
        console.log("Failed to create log:", err.message);
      }

      setShowModal(false);
    } else if (type === "update") {
      try {
        await fetch(`${API_BASE_URL}/${logToUpdate.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            user_id: 1,
            date_logged: dateLogged,
            item_id: parseInt(foodItem),
            servings: parseInt(servings),
          }),
          headers: {
            "Content-type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            setDateLogged("");
            setFoodItem("");
            setServings("");
          })
          .catch((err) => {
            console.log("Failed to update log:", err);
          });
      } catch (err) {
        console.log("Failed to update log:", err.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-start p-6 bg-gray-50">
        {type === "add" && (
          <h1 className="text-xl font-bold mb-6">Add New Log</h1>
        )}
        {type === "update" && (
          <h1 className="text-xl font-bold mb-6">Update Log</h1>
        )}

        <div className="mb-4 w-full max-w-sm">
          <label className="block mb-1 font-medium">
            Date logged (defaulted to today):
          </label>
          <input
            className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
            name="dateLogged"
            type="date"
            value={dateLogged}
            onChange={(e) => setDateLogged(e.target.value)}
          />
        </div>
        <div className="mb-4 w-full max-w-sm">
          <label className="block mb-1 font-medium">Food item:</label>
          <input
            className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
            name="foodItem"
            value={foodItem}
            onChange={(e) => setFoodItem(e.target.value)}
          />
        </div>
        <div className="mb-4 w-full max-w-sm">
          <label className="block mb-1 font-medium">Servings:</label>
          <input
            className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
            name="servings"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
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
    </form>
  );
}
