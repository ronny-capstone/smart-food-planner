import { useState, useEffect } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";
import GroceryList from "./components/GroceryList";
import UserAuth from "./components/UserAuth";
import Inventory from "./components/Inventory";
import ProfileForm from "./components/ProfileForm";
import NutritionDisplay from "./components/NutritionDisplay";
import MealRecForm from "./components/MealRecForm";
import GroceryRecForm from "./components/GroceryRecForm";
import { API_BASE_URL } from "./utils/api";
import { AUTH_PATH, INVENTORY_PATH, REMINDERS_PATH } from "./utils/paths";
import { ToastContainer } from "react-toastify";
import { checkExpiringItems, checkLowStock } from "./utils/inventoryReminders";
import { getDaysUntilExpiration } from "./utils/dateUtils";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // User id for logged in user
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("kitchen");
  const [inventory, setInventory] = useState([]);
  const [hasShownReminders, setHasShownReminders] = useState(false);

  // When loads, fetch current user's authentication status
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = () => {
    fetch(`${API_BASE_URL}${AUTH_PATH}/me`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return {
            authenticated: false,
            message: "Authenticated check failed",
          };
        }
      })
      .then((data) => {
        if (data.authenticated && data.user_id) {
          setCurrentUser(data.user_id);
          setIsAuthenticated(true);
        } else {
          console.log("User not logged in:", data.message);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setInventory([]);
        }
      })
      .catch((err) => {
        console.log("Failed to get current user:", err);
        setCurrentUser(null);
        setIsAuthenticated(false);
        setInventory([]);
      });
  };

  // Load inventory
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchInventory(currentUser);
    }
  }, [currentUser, isAuthenticated]);

  const fetchInventory = (userId) => {
    fetch(`${API_BASE_URL}${INVENTORY_PATH}?user_id=${userId}`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data) {
          setInventory(data);
        } else {
          console.log("Failed to fetch inventory");
          setInventory([]);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch inventory");
        setInventory([]);
      });
  };

  // Get reminders based on inventory
  useEffect(() => {
    if (
      isAuthenticated &&
      inventory &&
      inventory.length > 0 &&
      !hasShownReminders
    ) {
      checkExpiringItems(inventory, currentUser);
      checkLowStock(inventory, currentUser);
      setHasShownReminders(true);
    }
  }, [isAuthenticated, inventory, hasShownReminders]);

  // Bring back reminders the user chose to hide
  const resetHiddenReminders = async (currentUser) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${REMINDERS_PATH}?user_id=${currentUser}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log("Failed to reset reminders");
      return false;
    }
  };

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setIsAuthenticated(false);
        setInventory([]);
        setHasShownReminders(false);
        setActiveTab("kitchen");
      })
      .catch((err) => {
        console.log("Error logging out");
      });
  };

  const handleAuth = (isNewUser = false) => {
    setIsAuthenticated(true);
    if (isNewUser) {
      setActiveTab("profile");
    }
    fetchCurrentUser();
  };

  const tabs = [
    {
      id: "kitchen",
      label: "🏠 Kitchen",
      description: "Manage what you have",
      components: ["Inventory", "Grocery List"],
    },
    {
      id: "planning",
      label: "📅 Planning",
      description: "Plan what to cook",
      components: ["Meal Recommendations", "Shopping List Generator"],
    },
    {
      id: "tracking",
      label: "📊 Tracking",
      description: "Track what you eat",
      components: ["Food Logs", "Nutrition Goals"],
    },
    {
      id: "profile",
      label: "👤 Profile",
      description: "Adjust settings",
      components: ["Profile Settings"],
    },
  ];

  const getActiveTab = () => {
    return tabs.find((tab) => tab.id === activeTab) || tabs[0];
  };

  const getTabStyles = (tabId, isActive = false) => {
    const styles = {
      kitchen: {
        border: isActive
          ? "border-blue-500 !bg-blue-50 shadow-md"
          : "border-gray-200 !bg-white",
        header: "!bg-blue-50",
        text: "text-blue-900",
      },
      planning: {
        border: isActive
          ? "border-green-500 !bg-green-50 shadow-md"
          : "border-gray-200 !bg-white",
        header: "!bg-green-50",
        text: "text-green-900",
      },
      tracking: {
        border: isActive
          ? "border-purple-500 !bg-purple-50 shadow-md"
          : "border-gray-200 !bg-white",
        header: "!bg-purple-50",
        text: "text-purple-900",
      },
      profile: {
        border: isActive
          ? "border-gray-100 !bg-gray-100 shadow-md"
          : "border-gray-200 !bg-white",
        header: "!bg-gray-100",
        text: "text-gray-900",
      },
    };
    return styles[tabId] || styles.kitchen;
  };

  const inventoryStats = {
    total: inventory.length,
    fresh: inventory.filter(
      (item) => getDaysUntilExpiration(item.expiration_date) > 7
    ).length,
    expiringSoon: inventory.filter((item) => {
      const days = getDaysUntilExpiration(item.expiration_date);
      return days <= 3 && days >= 0;
    }).length,
    expired: inventory.filter(
      (item) => getDaysUntilExpiration(item.expiration_date) < 0
    ).length,
  };

  return (
    <>
      <div>
        <ToastContainer
          position="top-center"
          autoClose={2000}
          limit={2}
          toastStyle={{ "--toastify-color-progress-light": "#808080" }}
        />
        {/* If user is authenticated show main app, else login form */}
        {!isAuthenticated ? (
          <UserAuth onAuth={handleAuth} />
        ) : (
          <>
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🥗</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Smart Food Tracker
                  </h1>
                  <p className="text-gray-600">
                    Manage your kitchen and nutrition
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-4 rounded-lg border-2 ${
                        getTabStyles(tab.id, activeTab === tab.id).border
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {tab.label.split(" ")[0]}
                        </div>
                        <div
                          className={`font-semibold ${
                            activeTab === tab.id
                              ? getTabStyles(tab.id).text
                              : "text-gray-900"
                          }`}
                        >
                          {tab.label.split(" ")[1]}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {tab.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {tab.components.join(" • ")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        <span>{inventoryStats.total} items</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span>{inventoryStats.fresh} fresh</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        <span>{inventoryStats.expiringSoon} expiring</span>
                      </div>
                      {inventoryStats.expired > 0 && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span>{inventoryStats.expired} expired</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={async () => {
                          const success = await resetHiddenReminders(
                            currentUser
                          );
                          if (success) {
                            checkExpiringItems(inventory, currentUser);
                            checkLowStock(inventory, currentUser);
                          }
                        }}
                        className="!bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm"
                      >
                        🔔 Reset Hidden Reminders
                      </button>

                      <button
                        onClick={handleLogout}
                        className="!bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md">
                  <div
                    className={`border-b border-gray-200 px-6 px-4 ${
                      getTabStyles(activeTab).header
                    }`}
                  >
                    <h2
                      className={`text-xl font-semibold ${
                        getTabStyles(activeTab).text
                      }`}
                    >
                      {getActiveTab().label} - {getActiveTab().description}
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">
                      {getActiveTab().components.join(" and ")}
                    </p>
                  </div>

                  {activeTab === "kitchen" && (
                    <div className="p-6 space-y-8">
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">📦</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Inventory Management
                          </h3>
                        </div>
                        <Inventory
                          currentUser={currentUser}
                          inventory={inventory}
                          setInventory={setInventory}
                          handleInventoryUpdate={fetchInventory}
                        />
                      </div>
                      <hr className="border-gray-200" />
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">🛒</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Grocery List
                          </h3>
                        </div>
                        <GroceryList currentUser={currentUser} />
                      </div>
                    </div>
                  )}

                  {activeTab === "planning" && (
                    <div className="p-6 space-y-8">
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">🍽️</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Meal Recommendations
                          </h3>
                        </div>
                        <MealRecForm currentUser={currentUser} />
                      </div>
                      <hr className="border-gray-200" />
                      <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">📋</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Shopping List Generator
                        </h3>
                      </div>
                      <GroceryRecForm
                        currentUser={currentUser}
                        inventory={inventory}
                      />
                    </div>
                  )}

                  {activeTab === "tracking" && (
                    <div className="p-6 space-y-8">
                      <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">🎯</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Nutrition Goals & Progress
                        </h3>
                      </div>
                      <NutritionDisplay
                        className="!bg-white rounded-lg shadow-md p-6 mb-6"
                        currentUser={currentUser}
                        onClose={() => setShowGoals(false)}
                      />
                      <hr className="border-gray-200" />
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">📊</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Food Logs
                          </h3>
                        </div>
                        <LogList currentUser={currentUser} />
                      </div>
                    </div>
                  )}

                  {activeTab === "profile" && (
                    <div className="p-6 space-y-8">
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">👤</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Profile Settings
                          </h3>
                        </div>
                        <ProfileForm
                          className="!bg-white rounded-lg shadow-md p-6 mb-6"
                          currentUser={currentUser}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default App;
