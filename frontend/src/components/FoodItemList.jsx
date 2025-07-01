import FoodItemForm from "./FoodItemForm";
import LogModal from "./LogModal";
import { useEffect, useState } from "react";

export default function FoodItemList() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}> Add new food item </button>
      {showModal && (
        <LogModal onClose={() => setShowModal(false)}>
          {" "}
          <FoodItemForm />
        </LogModal>
      )}
    </div>
  );
}
