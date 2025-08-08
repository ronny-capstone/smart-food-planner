import { createPortal } from "react-dom";
import { API_BASE_URL } from "../utils/api";
import { toast } from "react-toastify";

export default function LogModal({
  children,
  onClose,
  itemResults,
  handleItemChosen,
  setItemResults,
}) {
  const getNutrient = (nutrients, name) => {
    const nutrient = nutrients.find((n) => n.name === name);
    return nutrient ? nutrient.amount : 0;
  };

  const handleButtonClick = (item) => {
    setItemResults("");
    try {
      // Get nutritional information for the chosen item
      fetch(`${API_BASE_URL}/food/nutrition?itemId=${item.id}&amount=1`)
        .then((response) => {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            throw new Error("unexpected response format");
          }
        })
        .then((data) => {
          const newFoodItem = {
            spoonacular_id: data.id,
            name: data.name,
            calories: getNutrient(data.nutrition.nutrients, "Calories"),
            protein: getNutrient(data.nutrition.nutrients, "Protein"),
            carbs: getNutrient(data.nutrition.nutrients, "Net Carbohydrates"),
            fats: getNutrient(data.nutrition.nutrients, "Fat"),
            sugars: getNutrient(data.nutrition.nutrients, "Sugar"),
          };

          // Try to add to database with duplicate handling
          fetch(`${API_BASE_URL}/food`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newFoodItem),
          })
            .then((res) => {
              if (res.status === 409) {
                return res.json().then((err) => {
                  toast.warning("Duplicate food item: ", err.existingItem.name);
                  throw new Error("Duplicate handled");
                });
              }
              return res.json();
            })
            .then((data) => {
              setItemResults([]);
              handleItemChosen(data);
              onClose();
            })
            .catch((err) => {
              console.log(err.message);
            });
        })
        .catch((err) => {
          console.log(err.message);
        });
    } catch (err) {
      console.log("Failed to fetch info:", err.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-2xl shadow-xl border border-gray-100 p-8 relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {itemResults?.length > 0 ? "Choose Food Item" : "Food Entry"}
          </h3>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          >
            ✖
          </button>
        </div>
        <div className="p-6">
          {children}
          {itemResults && itemResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Search Results ({itemResults.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {itemResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleButtonClick(item)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {item.name}
                      </span>
                      <div className="text-sm mr-1">Select</div>
                    </div>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded mt-2"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {(!itemResults || itemResults.length === 0) && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="!bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
