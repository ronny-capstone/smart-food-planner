import {
  formatDateString,
  getDaysUntilExpiration,
  getExpirationStatus,
  formatDay,
} from "../utils/dateUtils";
import { capitalize } from "../utils/stringUtils";

export default function InventoryCard({ item, handleEdit, handleDelete }) {
  const expirationStatus = getExpirationStatus(item.expiration_date);
  const daysUntil = getDaysUntilExpiration(item.expiration_date);

  const getStatusColor = (status) => {
    if (status === "Expired") {
      return "bg-red-100 text-red-800 border-red-200 w-2/3 mx-auto";
    } else if (status === "Expiring soon") {
      return "bg-orange-100 text-orange-800 border-orange-200 w-2/3 mx-auto";
    } else if (status === "Expiring this week") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200 w-2/3 mx-auto";
    } else {
      return "bg-green-100 text-green-800 border-green-200 w-2/3 mx-auto";
    }
  };

  const getStatusMessage = () => {
    if (expirationStatus == "Expired") {
      return `Expired ${formatDay(daysUntil)} ago`;
    } else if (expirationStatus == "Expiring soon") {
      return `Expires in ${formatDay(daysUntil)}`;
    } else if (expirationStatus == "Expiring this week") {
      return `Expires in ${formatDay(daysUntil)}`;
    } else if (expirationStatus == "Fresh") {
      return `Fresh (${daysUntil} days left)`;
    }
    return "Unknown";
  };

  return (
    <div className="itemCard">
      <h3 className="item-name">{capitalize(item.name)}</h3>
      <p className={getStatusColor(expirationStatus)}> {getStatusMessage()} </p>
      <p>Expires: {formatDateString(item.expiration_date)}</p>
      <p>Servings: {item.quantity}</p>
      <button
        className="!bg-sky-100 mr-1"
        id="editBtn"
        onClick={() => handleEdit(item)}
      >
        Edit
      </button>
      <button
        className="!bg-zinc-100 ml-1"
        id="deleteBtn"
        onClick={() => handleDelete(item)}
      >
        Remove
      </button>
    </div>
  );
}
