import { useState, useEffect } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";
import GroceryList from "./components/GroceryList";
import UserAuth from "./components/UserAuth";
import { API_BASE_URL } from "./utils/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setIsAuthenticated(false);
      })
      .catch((err) => {
        console.log("Error logging out");
      });
  };

  return (
    <>
      <div>
        {/* If user is authenticated show main app, else login form */}
        {!isAuthenticated ? (
          <UserAuth onAuth={() => setIsAuthenticated(true)} />
        ) : (
          <>
            <button onClick={handleLogout}> Log out</button>
            <LogList />
            <FoodItemList />
            <GroceryList />
          </>
        )}
      </div>
    </>
  );
}

export default App;
