import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH, RECIPES_PATH, INVENTORY_PATH } from "../utils/paths";

export default function MealRecForm({ currentUser, inventory }) {
  const [cuisine, setCuisine] = useState("");
  const [diet, setDiet] = useState("");
  const [intolerances, setIntolerances] = useState("");
  const [type, setType] = useState("");
  const [ingredientsIncluded, setIngredientsIncluded] = useState("");
  const [minCarbs, setMinCarbs] = useState(0);
  const [maxCarbs, setMaxCarbs] = useState(0);
  const [minProtein, setMinProtein] = useState(0);
  const [maxProtein, setMaxProtein] = useState(0);
  const [minCalories, setMinCalories] = useState(0);
  const [maxCalories, setMaxCalories] = useState(0);
  const [minFat, setMinFat] = useState(0);
  const [maxFat, setMaxFat] = useState(0);

  const [recipes, setRecipes] = useState([]);
  // Set if search led to no recipes
  const [noResults, setNoResults] = useState(false);
  // Set whether a search is in progress
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);

  const nutritionParams = {
    cuisine,
    diet,
    intolerances,
    type,
    minCarbs,
    maxCarbs,
    minProtein,
    maxProtein,
    minCalories,
    maxCalories,
    minFat,
    maxFat,
  };

  const cuisinesList = [
    "African",
    "Asian",
    "American",
    "Cajun",
    "Caribbean",
    "Chinese",
    "Eastern European",
    "European",
    "French",
    "German",
    "Greek",
    "Indian",
    "Irish",
    "Italian",
    "Japanese",
    "Jewish",
    "Korean",
    "Latin American",
    "Mediterranean",
    "Mexican",
    "Middle Eastern",
    "Nordic",
    "Southern",
    "Spanish",
    "Thai",
    "Vietnamese",
  ];
  const dietsList = [
    "Gluten Free",
    "Ketogenic",
    "Vegetarian",
    "Vegan",
    "Pescetarian",
    "Paleo",
  ];

  const intolerancesList = [
    "Dairy",
    "Egg",
    "Gluten",
    "Grain",
    "Peanut",
    "Seafood",
    "Sesame",
    "Shellfish",
    "Soy",
    "Sulfite",
    "Tree Nut",
    "Wheat",
  ];

  const typeList = [
    "main course",
    "side dish",
    "dessert",
    "appetizer",
    "salad",
    "bread",
    "breakfast",
    "soup",
    "snack",
  ];

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
        setDiet(data.profile.dietary_preferences);
      })
      .catch((err) => {
        setDiet("");
      });
  }, [currentUser]);

  const handleItemToggle = (item) => {
    setSelectedInventoryItems((prev) => {
      // Search through selected items, check if selected
      if (prev.find((selected) => selected.id === item.id)) {
        // Remove if already selected (unselect)
        return prev.filter((selected) => selected.id !== item.id);
      } else {
        // Add item if not selected
        return [...prev, item];
      }
    });
  };

  const handleSubmit = (e) => {
    // Stops page from refreshing
    e.preventDefault();
    setIsSearching(true);
    setNoResults(false);
    setRecipes([]);
    try {
      const params = new URLSearchParams();
      Object.entries(nutritionParams).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      if (selectedInventoryItems.length > 0) {
        const ingredients = selectedInventoryItems
          .map((item) => item.name)
          .join(",");
        params.append("includeIngredients", ingredients);
      }

      fetch(`${API_BASE_URL}${RECIPES_PATH}?${params}`)
        .then((response) => response.json())
        .then((data) => {
          setIsSearching(true);
          setNoResults(false);
          setRecipes([]);
          if (data.totalResults === 0 || data.recipes.length === 0) {
            setNoResults(true);
            setRecipes([]);
          } else if (data) {
            setRecipes(data.recipes);
            setNoResults(false);
          } else {
            alert("Failed to get meal recommendations");
          }
          setIsSearching(false);
        })
        .catch((err) => {
          alert(`Failed to get meal recommendations`);
        });
    } catch (err) {
      alert(`Failed to get meal recommendations`);
    }
  };

  const clearForm = () => {
    setCuisine("");
    setIntolerances("");
    setType("");
    setIngredientsIncluded("");
    setRecipes("");
    setMinCarbs(0);
    setMaxCarbs(0);
    setMinProtein(0);
    setMaxProtein(0);
    setMinCalories(0);
    setMaxCalories(0);
    setMinFat(0);
    setMaxFat(0);
    setSelectedInventoryItems([]);
    setNoResults(false);
    setIsSearching(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h1>Meal Recommendation</h1>

        <div>
          <p>Ingredients To Include</p>
          <label>Select Ingredients From Your Inventory</label>
          {inventory.length === 0 ? (
            <p>No items in your inventory</p>
          ) : (
            <div>
              {inventory.map((item) => (
                <div key={item.id} onClick={() => handleItemToggle(item)}>
                  <p className="bg-blue-100">{item.name}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Expires: {item.expiration_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedInventoryItems.length > 0 && (
          <div>
            <p>Selected from inventory:</p>
            {selectedInventoryItems.map((item) => (
              <div key={item.id}>
                <p>{item.name}</p>
                <button onClick={() => handleItemToggle(item)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <div>
          <p>Cuisine</p>
          <select
            name="cuisine"
            value={cuisine}
            placeholder={"Cuisine"}
            onChange={(e) => setCuisine(e.target.value)}
          >
            <option value="">Select Cuisine</option>
            <option value={""}>No preference</option>
            {cuisinesList.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p>Diet</p>
          <p>Following diet: {diet}</p>
        </div>

        <div>
          <p>Intolerances</p>
          <select
            name="intolerances"
            value={intolerances}
            placeholder={"Intolerances"}
            onChange={(e) => setIntolerances(e.target.value)}
          >
            <option value="">Select intolerances</option>
            <option value={""}>No intolerances</option>
            {intolerancesList.map((intolerance) => (
              <option key={intolerance} value={intolerance}>
                {intolerance}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p>Meal Type</p>
          <select
            name="mealType"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select meal type</option>
            <option value={""}>No preference</option>

            {typeList.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-1 w-full max-w-sm">
          <button type="button" onClick={clearForm}>
            Clear Filters
          </button>
        </div>

        <div className="mb-1 w-full max-w-sm">
          <button type="submit">Suggest Meal</button>
        </div>

        {recipes.length > 0 && (
          <div>
            <h2> Recipe Recommendations ({recipes.length}) </h2>
            {recipes.map((recipe) => (
              <div key={recipe.id}>
                <img src={recipe.image} alt={recipe.title} />
                <p> {recipe.title} </p>
              </div>
            ))}
          </div>
        )}

        {noResults && !isSearching && (
          <div>
            <p> No recipes found, try adjusting search crieteria. </p>
          </div>
        )}
      </div>
    </form>
  );
}
