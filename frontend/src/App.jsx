import { useState } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";
import GroceryList from "./components/GroceryList";

function App() {
  return (
    <>
      <div>
        <LogList />
        <FoodItemList />
        <GroceryList/>
      </div>
    </>
  );
}

export default App;
