import GroceryForm from "./GroceryForm";
import LogModal from "./LogModal";
import { useEffect } from "react";
import { useState } from "react";
import { API_BASE_URL } from "../utils/api";

export default function GroceryList() {
  const [groceries, setGroceries] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [groceryToUpdate, setGroceryToUpdate] = useState(null);
  const GROCERY_PATH = "/grocery";

  useEffect(() => {
    fetchGroceries();
  }, []);

  const fetchGroceries = () => {
    fetch(`${API_BASE_URL}${GROCERY_PATH}?user_id=1`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setGroceries(data);
        } else {
          console.log("Expected array but got ", typeof data);
          setGroceries([]);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch grocery items: ", err);
        setGroceries([]);
      });
  };

  const handleGroceryAdded = (createdGrocery) => {
    setGroceries((prevGroceries) => [createdGrocery.item, ...prevGroceries]);
    setActiveModal(null);
  };

  const handleGroceryUpdated = (updatedGrocery) => {
    setGroceries((prevGroceries) =>
      prevGroceries.map((grocery) => {
        if (grocery.id === updatedGrocery.item.id) {
          return {
            ...grocery,
            item_id: updatedGrocery.item.id,
            food_name: updatedGrocery.item.name,
            quantity: updatedGrocery.item.quantity,
            expirationDate: updatedGrocery.item.expiration_date,
          };
        }
        return grocery;
      })
    );
    // Refetch
    fetchGroceries();
    setActiveModal(null);
    setGroceryToUpdate(null);
  };

  const handleDelete = (groceryToDelete) => {
    try {
      fetch(`${API_BASE_URL}${GROCERY_PATH}/${groceryToDelete.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 200) {
            setGroceries(
              groceries.filter((grocery) => grocery.id !== groceryToDelete.id)
            );
          } else {
            alert(`Error deleting item: ${response.json().error}`);
          }
        })
        .catch((err) => {
          console.log("Failed to delete grocery item:", err);
          alert("Error deleting grocery item. Please try again");
        });
    } catch (err) {
      console.log("Failed to delete grocery item:", err.message);
    }
  };

  const openAddModal = () => {
    setActiveModal("add");
    setGroceryToUpdate(null);
  };

  const openUpdateModal = (grocery) => {
    setActiveModal(`update-${grocery.id}`);
    setGroceryToUpdate(grocery);
  };

  const closeModal = () => {
    setActiveModal(null);
    setGroceryToUpdate(null);
  };

  const formatDateString = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date();
    const expireDate = new Date(expirationDate);
    const timeDifference = expireDate.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
  };

  const getExpirationStatus = (expirationDate) => {
    const days = getDaysUntilExpiration(expirationDate);
    if (days < 0) {
      return "Expired";
    } else if (days <= 3) {
      return "Expiring soon";
    } else if (days <= 7) {
      return "Expiring this week";
    }
    return "Fresh";
  };

  const getStatusColor = (status) => {
    if (status === "Expired") {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (status === "Expiring soon") {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else if (status === "Expiring this week") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div>
      <h1> Grocery List </h1>
      <button onClick={openAddModal}> Add Grocery Item </button>

      {/* Add Modal */}
      {activeModal === "add" && (
        <LogModal onClose={closeModal}>
          <GroceryForm
            handleGroceryAdded={handleGroceryAdded}
            handleGroceryUpdated={handleGroceryUpdated}
            setShowModal={closeModal}
            type="add"
            groceryToUpdate={null}
          />
        </LogModal>
      )}

      {/* Grocery items */}
      <div className="groceryList">
        <h2> Your Grocery Items ({groceries.length}) </h2>
        {groceries.length == 0 && <p> Your grocery list is empty! </p>}

        {groceries
          .sort(
            (a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)
          )
          .map((grocery) => {
            const expirationStatus = getExpirationStatus(
              grocery.expiration_date
            );
            const daysUntil = getDaysUntilExpiration(grocery.expiration_date);
            return (
              <div className="groceryCard" key={grocery.id}>
                <h3 className="grocery-name"> {grocery.food_name}</h3>
                <p className={getStatusColor(expirationStatus)}>
                  {expirationStatus === "Expired" &&
                    `Expired ${Math.abs(daysUntil)} day${
                      Math.abs(daysUntil) !== 1 ? "s" : ""
                    } ago`}
                  {expirationStatus === "Expiring soon" &&
                    `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
                  {expirationStatus === "Expiring this week" &&
                    `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
                  {expirationStatus === "Fresh" &&
                    `Fresh (${daysUntil} days left)`}
                </p>
                <p> Added: {formatDateString(grocery.added_date)} </p>
                <p> Expires: {formatDateString(grocery.expiration_date)} </p>
                <p> Servings: {grocery.quantity} </p>

                <button onClick={() => openUpdateModal(grocery)}> Edit </button>
                <button onClick={() => handleDelete(grocery)}> Remove </button>
              </div>
            );
          })}
        {/* Update Modal */}
        {groceryToUpdate && activeModal === `update-${groceryToUpdate.id}` && (
          <LogModal onClose={closeModal}>
            <GroceryForm
              handleGroceryAdded={handleGroceryAdded}
              handleGroceryUpdated={handleGroceryUpdated}
              setShowModal={closeModal}
              type="update"
              groceryToUpdate={groceryToUpdate}
            />
          </LogModal>
        )}

        {/* Statistics */}
        {groceries.length > 0 && (
          <div>
            <h3> Quick Overview: </h3>
            <p> Total items: {groceries.length} </p>
            <p>
              {" "}
              Expiring soon:{" "}
              {
                groceries.filter(
                  (g) =>
                    getDaysUntilExpiration(g.expiration_date) <= 3 &&
                    getDaysUntilExpiration(g.expiration_date) >= 0
                ).length
              }{" "}
            </p>
            <p>
              {" "}
              Expired:{" "}
              {
                groceries.filter(
                  (g) => getDaysUntilExpiration(g.expiration_date) < 0
                ).length
              }{" "}
            </p>
            <p>
              {" "}
              Fresh items:{" "}
              {
                groceries.filter(
                  (g) => getDaysUntilExpiration(g.expiration_date) > 7
                ).length
              }{" "}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
