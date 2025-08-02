import GroceryForm from "./GroceryForm";
import GroceryCard from "./GroceryCard";
import LogModal from "./LogModal";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { GROCERY_PATH } from "../utils/paths";
import { toast } from "react-toastify";
import { TYPES } from "../utils/groceryConstants";

export default function GroceryList({ currentUser }) {
  const [groceries, setGroceries] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [groceryToUpdate, setGroceryToUpdate] = useState(null);

  useEffect(() => {
    // Wait until we have currentUser to fetch groceries
    if (currentUser) {
      fetchGroceries(currentUser);
    }
  }, [currentUser]);

  const fetchGroceries = (userId) => {
    fetch(`${API_BASE_URL}${GROCERY_PATH}?user_id=${userId}`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setGroceries(data);
        } else {
          setGroceries([]);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch grocery items: ");
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
          };
        }
        return grocery;
      })
    );
    // Refetch
    fetchGroceries(currentUser);
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
            toast.error(`Error deleting item. Please try again`);
          }
        })
        .catch((err) => {
          toast.error("Error deleting grocery item. Please try again");
        });
    } catch (err) {
      toast.error("Failed to delete grocery item:");
    }
  };

  const openAddModal = () => {
    setActiveModal(TYPES.ADD);
    setGroceryToUpdate(null);
  };

  const openUpdateModal = (grocery) => {
    setActiveModal(TYPES.UPDATE);
    setGroceryToUpdate(grocery);
  };

  const closeModal = () => {
    setActiveModal(null);
    setGroceryToUpdate(null);
  };

  return (
    <div>
      <h1> Grocery List </h1>
      <button onClick={openAddModal}>Add Grocery Item</button>

      {/* Add Modal */}
      {activeModal === TYPES.ADD && (
        <LogModal onClose={closeModal}>
          <GroceryForm
            handleGroceryAdded={handleGroceryAdded}
            handleGroceryUpdated={handleGroceryUpdated}
            setShowModal={closeModal}
            type={TYPES.ADD}
            groceryToUpdate={null}
            currentUser={currentUser}
          />
        </LogModal>
      )}

      {/* Main grocery list section */}
      <div className="groceryList">
        <h2>Your Grocery Items ({groceries.length})</h2>
        {groceries.length == 0 && <p>Your grocery list is empty!</p>}

        {groceries.map((grocery) => {
          return (
            <GroceryCard
              key={grocery.id}
              grocery={grocery}
              handleEdit={openUpdateModal}
              handleDelete={handleDelete}
            />
          );
        })}

        {/* Update Modal */}
        {groceryToUpdate && activeModal === TYPES.UPDATE && (
          <LogModal onClose={closeModal}>
            <GroceryForm
              handleGroceryAdded={handleGroceryAdded}
              handleGroceryUpdated={handleGroceryUpdated}
              setShowModal={closeModal}
              type={TYPES.UPDATE}
              groceryToUpdate={groceryToUpdate}
              currentUser={currentUser}
            />
          </LogModal>
        )}
      </div>
    </div>
  );
}
