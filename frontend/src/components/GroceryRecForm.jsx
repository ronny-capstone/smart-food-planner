import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH } from "../utils/paths";
import { GENERATE_PATH, GROCERY_LIST_PATH, EXPORT_PATH } from "../utils/paths";
import { listToString } from "../utils/listToString";
import { capitalize, formatServings } from "../utils/stringUtils";
import { toast } from "react-toastify";
import { types } from "../utils/groceryConstants";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

export default function GroceryRecForm({ currentUser }) {
  const [form, setForm] = useState({
    result: null,
    noResults: false,
    isSearching: false,
    diet: "",
    budget: 20,
    useDiet: true,
    allowRepeats: false,
    maxRepeats: 1,
  });
  const [sliderRef, instanceRef] = useKeenSlider({
    slides: { perView: 1, spacing: 16 },
    loop: true,
  });

  const prev = () => {
    instanceRef.current?.prev();
  };

  const next = () => {
    instanceRef.current?.next();
  };

  // Fetch user's diet from profile
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    // Get current user's profile, if exists
    fetch(`${API_BASE_URL}${PROFILE_PATH}/${currentUser}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Profile not found");
        }
      })
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          useDiet: true,
          diet: data.profile.dietary_preferences,
        }));
      })
      .catch((err) => {
        setForm((prev) => ({ ...prev, useDiet: false, diet: "" }));
      });
  }, [currentUser]);

  const clearResults = () => {
    setForm((prev) => ({
      ...prev,
      result: null,
      noResults: false,
    }));
  };

  const clearForm = () => {
    setForm((prev) => ({
      ...prev,
      isSearching: false,
      diet: "",
      budget: 20,
      useDiet: true,
      result: null,
      allowRepeats: false,
      maxRepeats: 1,
    }));
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleExport = (groceryListText) => {
    fetch(`${API_BASE_URL}${GROCERY_LIST_PATH}${EXPORT_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groceryListText }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Export failed");
        }
      })
      .then(({ fileName, data }) => {
        // Create blob with data
        const blob = new Blob([data], { type: "text/plain" });
        // Create temporary URL that points to blob
        const url = URL.createObjectURL(blob);
        // Create temporary anchor element to trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        // Click anchor to start download
        a.click();
        // Clean up by removing temporary URL
        URL.revokeObjectURL(url);
        toast.success("Grocery list exported!");
      })
      .catch((err) => {
        toast.error("Failed to export grocery list");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, isSearching: true, noResults: false }));
    const params = new URLSearchParams({
      budget: form.budget,
      allowRepeats: form.allowRepeats,
      maxRepeats: form.maxRepeats,
    });

    try {
      fetch(
        `${API_BASE_URL}${GROCERY_LIST_PATH}${GENERATE_PATH}/${currentUser}?${params}`
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          setForm((prev) => ({
            ...prev,
            result: data,
            noResults: false,
            isSearching: false,
          }));
          toast.success("Grocery list recommendations generated!");
        })
        .catch((err) => {
          toast.error("Failed to get grocery list recommendations");
          setForm((prev) => ({ ...prev, noResults: true, isSearching: false }));
        });
    } catch (err) {
      toast.error("Failed to get grocery list recommendations");
      setForm((prev) => ({ ...prev, noResults: true, isSearching: false }));
    }
  };

  return (
    <div>
      <h1 className="mb-1">Grocery List Generator</h1>
      <p className="text-lg text-gray-600 mb-2">
        Get personalized grocery recommendations
      </p>
      <div>
        <label>Budget: $</label>
        <input
          type="number"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          min="1"
          required
          className="mb-1"
        ></input>
      </div>
      <div>
        <input
          type="checkbox"
          name="allowRepeats"
          checked={form.allowRepeats}
          onChange={handleChange}
          className="mb-2"
        />
        <label>Allow repeat meals</label>
      </div>
      <div>
        <label>Max number of repeated meals:</label>
        <input
          type="number"
          name="maxRepeats"
          value={form.maxRepeats}
          onChange={handleChange}
          min="1"
          max="10"
          className="mb-2"
        ></input>
      </div>

      <div className="mb-1 w-full max-w-sm">
        <button type="button" onClick={clearForm}>
          Clear Filters
        </button>
      </div>

      {form.result && (
        <button type="button" onClick={clearResults}>
          Clear Results
        </button>
      )}

      <div className="mb-1 w-full max-w-sm">
        <button
          className="!bg-emerald-50"
          id="generateBtn"
          type="submit"
          onClick={handleSubmit}
        >
          Generate Grocery List
        </button>
      </div>

      {form.result?.types && !form.noResults && (
        <div>
          <h2 className="text-xl mb-2">Grocery List Strategies</h2>
          <div ref={sliderRef} className="keen-slider">
            {[
              "bestOverall",
              "budgetMaximizer",
              "inventoryMaximizer",
              "complexityMaximizer",
            ].map((type) => {
              const groceryType = form.result.types[type];
              if (!groceryType) {
                return null;
              }
              const groceryList = groceryType.groceryList || {};
              return (
                <div
                  key={type}
                  className="keen-slider__slide mb-8 p-4 border rounded"
                >
                  <h3 className="text-xl font-semibold ${} text-gray-800 mb-1">
                    {types[type].title}
                  </h3>
                  <p className={`${types[type].color} mb-2`}>
                    {types[type].text}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-3 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p>
                        Total cost: ${Number(groceryType.totalCost).toFixed(2)}{" "}
                        out of ${form.budget} budget
                      </p>
                    </div>
                    <div className="text-center">
                      <p>Budget Used: {groceryType.budgetUsed}%</p>
                    </div>
                    <div className="text-center">
                      <p>Total meals: {groceryType.mealsCount} </p>
                    </div>
                    <div className="text-center">
                      {groceryType.avgRecipeInventoryUsage !== undefined && (
                        <p>
                          Avg. Ingredient Coverage:{" "}
                          {Math.round(
                            groceryType.avgRecipeInventoryUsage * 100
                          )}
                          %
                        </p>
                      )}
                    </div>
                  </div>

                  {groceryType.recipes?.length > 0 && (
                    <div>
                      <h4 className="text-xl mb-1">Meal Plan:</h4>
                      {groceryType.recipes.map((meal, index) => (
                        <div key={index}>
                          <p>
                            Meal {index + 1}: {meal.title}
                            {meal.repeatNumber && meal.repeatNumber > 1 && (
                              <span> (#{meal.repeatNumber})</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {groceryList.shoppingList?.length > 0 ? (
                    <div>
                      <h4 className="text-xl mt-1 mb-1">Shopping List:</h4>
                      <p className="font-semibold text-lg">
                        Items to buy ({groceryList.itemsNeeded}){" "}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 mb-6">
                        {groceryList.shoppingList
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((item, index) => (
                            <div
                              key={index}
                              className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-sm"
                            >
                              <p>
                                {capitalize(item.name)} -{" "}
                                {formatServings(item.servingsNeeded)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p>No items needed - you have everything!</p>
                  )}
                  {groceryList?.inventoryRecommendations?.length > 0 && (
                    <div>
                      <p className="text-lg mt-2 mb-2">
                        While you're at the store, you may want to buy:{" "}
                      </p>
                      {groceryList.inventoryRecommendations.map(
                        (item, index) => (
                          <div
                            key={index}
                            className={`border p-2 rounded ${
                              item.type === "expiring-replacement"
                                ? "bg-orange-50 border-orange-200 w-2/3 mx-auto"
                                : "bg-yellow-50 border-yellow-200 w-2/3 mx-auto"
                            }`}
                          >
                            <p>
                              {capitalize(item.name)}:{" "}
                              {item.reason.toLowerCase()}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div>
                    <button
                      className="!bg-indigo-400 hover:!bg-indigo-500 !text-white !px-4 !py-2 !mt-3 !rounded-lg"
                      onClick={() =>
                        handleExport(
                          listToString(
                            groceryList.shoppingList,
                            groceryList.inventoryRecommendations
                          )
                        )
                      }
                    >
                      Export grocery list
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={prev}
              className="absolute left-0 top-1/3 bg-gray-200 hover:bg-gray-300 p-2 rounded-full shadow"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/3 bg-gray-200 hover:bg-gray-300 p-2 rounded-full shadow"
              aria-label="Next"
            >
              →
            </button>
          </div>
        </div>
      )}

      {form.isSearching && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <p className="text-lg font-medium text-gray-700">
            Generating grocery list...
          </p>
          <img src="/infinityLoading.gif" alt="Loading" className="w-32 h-32" />
        </div>
      )}

      {form.noResults && !form.isSearching && (
        <div>
          <p> Grocery list could not be generated. </p>
        </div>
      )}
    </div>
  );
}
