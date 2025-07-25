import { formatDateString } from "../utils/dateUtils";

export default function GroceryCard({ grocery, handleEdit, handleDelete }) {
  return (
    <div className="groceryCard">
      <h3 className="grocery-name">{grocery.name}</h3>
      <p>Added: {formatDateString(grocery.added_date)}</p>
      <p>Servings: {grocery.quantity}</p>

      <button id="editBtn" onClick={() => handleEdit(grocery)}>
        Edit
      </button>
      <button id="deleteBtn" onClick={() => handleDelete(grocery)}>
        Remove
      </button>
    </div>
  );
}
