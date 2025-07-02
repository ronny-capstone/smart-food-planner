import FoodItemForm from "./FoodItemForm";
import LogModal from "./LogModal";
import { useState } from "react";

export default function FoodItemList() {
  const [showModal, setShowModal] = useState(false);
  const [itemResults, setItemResults] = useState([]);
  const [item, setItem] = useState([]);

  const handleItemAdded = (newItems) => {
    setItemResults((prevItemResults) => [...newItems, ...prevItemResults]);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}> Add new food item </button>
      {showModal && (
        <LogModal
          setItemResults={setItemResults}
          itemResults={itemResults}
          setItem={setItem}
          onClose={() => setShowModal(false)}
        >
          {" "}
          <FoodItemForm
            handleItemAdded={handleItemAdded}
            setShowModal={setShowModal}
          />
        </LogModal>
      )}
      {item.length == 0 && <p> No items yet! </p>}
      {item && <p> {item.name} </p>}
    </div>
  );
}
