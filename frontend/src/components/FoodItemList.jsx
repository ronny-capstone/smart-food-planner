import FoodItemForm from "./FoodItemForm";
import LogModal from "./LogModal";
import { useState } from "react";

export default function FoodItemList() {
  const [showModal, setShowModal] = useState(false);
  const [itemResults, setItemResults] = useState([]);
  const [item, setItem] = useState([]);
  const [chosenItems, setChoseItems] = useState([]);

  const handleItemAdded = (newItems) => {
    setItemResults((prevItemResults) => [newItems, ...prevItemResults]);
  };

  const handleItemChosen = (chosenItem) => {
    setItemResults((prevChosenItems) => [...prevChosenItems, chosenItem]);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}> Add new food item </button>
      {showModal && (
        <LogModal
          setItemResults={setItemResults}
          itemResults={itemResults}
          setItem={setItem}
          handleItemChosen={handleItemChosen}
          onClose={() => setShowModal(false)}
        >
          {" "}
          <FoodItemForm
            handleItemAdded={handleItemAdded}
            setShowModal={setShowModal}
          />
        </LogModal>
      )}
      {chosenItems.length == 0 && <p> No items yet! </p>}
      {chosenItems.map((chosenItem) => {
        <p> {chosenItem.name} </p>;
      })}
    </div>
  );
}
