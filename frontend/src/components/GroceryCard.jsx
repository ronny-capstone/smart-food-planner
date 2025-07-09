import {
  formatDateString,
} from "../utils/dateUtils";

export default function GroceryCard({ grocery, handleEdit, handleDelete }) {

  return (
    <div className="groceryCard">
      <h3 className="grocery-name">{grocery.name}</h3>
      <p>Added: {formatDateString(grocery.added_date)}</p>
      <p>Servings: {grocery.quantity}</p>

      <button onClick={() => handleEdit(grocery)}>Edit</button>
      <button onClick={() => handleDelete(grocery)}>Remove</button>
    </div>
  );
}
