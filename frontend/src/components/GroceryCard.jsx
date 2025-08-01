import { formatDateString } from "../utils/dateUtils";
import { capitalize } from "../utils/stringUtils";

export default function GroceryCard({ grocery, handleEdit, handleDelete }) {
  return (
    <div className="groceryCard">
      <h3 className="grocery-name">{capitalize(grocery.name)}</h3>
      <p>Added: {formatDateString(grocery.added_date)}</p>
      <p>Servings: {grocery.quantity}</p>

      <button
        className="!bg-sky-100 mr-1"
        id="editBtn"
        onClick={() => handleEdit(grocery)}
      >
        Edit
      </button>
      <button
        className="!bg-zinc-100 ml-1"
        id="deleteBtn"
        onClick={() => handleDelete(grocery)}
      >
        Remove
      </button>
    </div>
  );
}
