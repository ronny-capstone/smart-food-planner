import InventoryForm from "./InventoryForm";
import InventoryCard from "./InventoryCard";
import LogModal from "./LogModal";
import { useState } from "react";
import { getDaysUntilExpiration } from "../utils/dateUtils";
import { API_BASE_URL } from "../utils/api";
import { INVENTORY_PATH } from "../utils/paths";
import { toast } from "react-toastify";
import { TYPES } from "../utils/groceryConstants";

export default function Inventory({ currentUser, inventory, setInventory }) {
  const [activeModal, setActiveModal] = useState(false);
  const [groceryToUpdate, setGroceryToUpdate] = useState(null);

  const handleGroceryAdded = (createdGrocery) => {
    setInventory((prevGroceries) => [createdGrocery.item, ...prevGroceries]);
    setActiveModal(null);
  };

  const handleGroceryUpdated = (updatedGrocery) => {
    setInventory((prevGroceries) =>
      prevGroceries.map((grocery) => {
        if (grocery.id === updatedGrocery.item.id) {
          return {
            ...grocery,
            item_id: updatedGrocery.item.id,
            name: updatedGrocery.item.name,
            quantity: updatedGrocery.item.quantity,
            expiration_date: updatedGrocery.item.expiration_date,
          };
        }
        return grocery;
      })
    );
    setActiveModal(null);
    setGroceryToUpdate(null);
  };

  const handleDelete = (groceryToDelete) => {
    try {
      fetch(`${API_BASE_URL}${INVENTORY_PATH}/${groceryToDelete.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 200) {
            setInventory(
              inventory.filter((grocery) => grocery.id !== groceryToDelete.id)
            );
          } else {
            toast.error(`Error deleting item`);
          }
        })
        .catch((err) => {
          toast.error("Error deleting grocery item. Please try again");
        });
    } catch (err) {
      toast.error("Failed to delete grocery item");
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

  // Sort inventory by expiration date
  const sortedItems = inventory.sort(
    (a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)
  );

  return (
    <div>
      <h1>Inventory</h1>
      <button className="!bg-emerald-50" onClick={openAddModal}>Add Food Item</button>

      {/* Add Modal */}
      {activeModal === TYPES.ADD && (
        <LogModal onClose={closeModal}>
          <InventoryForm
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
      <div className="inventoryList">
        <h2>Your Food Items ({inventory.length})</h2>
        {inventory.length == 0 && <p>Your inventory is empty!</p>}

        {sortedItems.map((item) => {
          return (
            <InventoryCard
              key={item.id}
              item={item}
              handleEdit={openUpdateModal}
              handleDelete={handleDelete}
            />
          );
        })}

        {/* Update Modal */}
        {groceryToUpdate && activeModal === TYPES.UPDATE && (
          <LogModal onClose={closeModal}>
            <InventoryForm
              handleGroceryAdded={handleGroceryAdded}
              handleGroceryUpdated={handleGroceryUpdated}
              setShowModal={closeModal}
              type={TYPES.UPDATE}
              groceryToUpdate={groceryToUpdate}
              currentUser={currentUser}
            />
          </LogModal>
        )}

        {/* Statistics, only shows if there are groceries in inventory */}
        {inventory.length > 0 && (
          <div>
            <h3>Quick Overview:</h3>
            <p>Total items: {inventory.length}</p>
            <p>
              {/* Count items expiring soon (<=3 days remaining) */}
              Expiring soon:
              {
                inventory.filter(
                  (g) =>
                    getDaysUntilExpiration(g.expiration_date) <= 3 &&
                    getDaysUntilExpiration(g.expiration_date) >= 0
                ).length
              }
            </p>
            <p>
              {/* Count expired items (<0 days remaining) */}
              Expired:
              {
                inventory.filter(
                  (g) => getDaysUntilExpiration(g.expiration_date) < 0
                ).length
              }
            </p>
            {/* Count fresh items (>7 days remaining) */}
            <p>
              Fresh items:
              {
                inventory.filter(
                  (g) => getDaysUntilExpiration(g.expiration_date) > 7
                ).length
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
