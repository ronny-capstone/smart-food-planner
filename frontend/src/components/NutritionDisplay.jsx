import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { LOG_PATH, PROFILE_PATH, FOOD_PATH } from "../utils/paths";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

export default function NutritionDisplay({ currentUser }) {
  const [calorieGoal, setCalorieGoal] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatsGoal, setFatsGoal] = useState(0);
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [calorieProgress, setCalorieProgress] = useState("");
  const [proteinProgress, setProteinProgress] = useState("");
  const [carbProgress, setCarbProgress] = useState("");
  const [fatsProgress, setFatsProgress] = useState("");
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatsConsumed, setFatsConsumed] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    // Fetch nutritional data for current user
    fetch(`${API_BASE_URL}${PROFILE_PATH}/${currentUser}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Profile not found");
        }
      })
      .then((data) => {
        // Sets state to 0 if value is undefined
        setCalorieGoal(parseInt(data.profile.calorie_goal) || 0);
        setProteinGoal(parseInt(data.profile.protein_goal) || 0);
        setCarbGoal(parseInt(data.profile.carb_goal) || 0);
        setFatsGoal(parseInt(data.profile.fat_goal) || 0);
        setBmr(data.profile.bmr || 0);
        setTdee(data.profile.tdee || 0);
        setGoalsLoaded(true);
      })
      .catch((err) => {
        toast.error("Unable to load nutrition goals");
      });
  }, [currentUser]);

  const fetchTodaysConsumption = () => {
    fetch(`${API_BASE_URL}${LOG_PATH}/${currentUser}/today`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Error fetching logs");
        }
      })
      .then((logs) => {
        if (logs.length === 0) {
          console.log("No food logged");
          toast.info("No food logged yet today");
          // Set progress to 0
          setCalorieProgress(0);
          setProteinProgress(0);
          setCarbProgress(0);
          setFatsProgress(0);
          return;
        }
        // Calculate daily macro totals
        let daily_calories = 0;
        let daily_protein = 0;
        let daily_carbs = 0;
        let daily_fats = 0;
        let logCount = 0;

        logs.forEach((log) => {
          // Get food item to find spoonacular id
          fetch(`${API_BASE_URL}${FOOD_PATH}/${log.item_id}`)
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error("Food item not found");
              }
            })
            .then((data) => {
              const servings = log.servings || 1;
              daily_calories += (data.calories ?? 0) * servings;
              daily_protein += (data.protein ?? 0) * servings;
              daily_carbs += (data.carbs ?? 0) * servings;
              daily_fats += (data.fats ?? 0) * servings;

              logCount++;

              // Check if we're done with logs
              if (logCount === logs.length) {
                // Calculate percentages
                const percentages = percentDailyGoals(
                  daily_calories,
                  daily_protein,
                  daily_carbs,
                  daily_fats
                );

                // Set consumed amount
                setCaloriesConsumed(daily_calories);
                setProteinConsumed(daily_protein);
                setCarbsConsumed(daily_carbs);
                setFatsConsumed(daily_fats);

                // Set percentages
                setCalorieProgress(percentages.percentCalories);
                setProteinProgress(percentages.percentProtein);
                setCarbProgress(percentages.percentCarbs);
                setFatsProgress(percentages.percentFats);
              }
            })
            .catch((err) => {
              logCount++;
              if (logCount === logs.length) {
                const percentages = percentDailyGoals(
                  daily_calories,
                  daily_protein,
                  daily_carbs,
                  daily_fats
                );

                setCalorieProgress(percentages.percentCalories);
                setProteinProgress(percentages.percentProtein);
                setCarbProgress(percentages.percentCarbs);
                setFatsProgress(percentages.percentFats);
              }
            })
            .catch((err) => {
              setCalorieProgress(0);
              setProteinProgress(0);
              setCarbProgress(0);
              setFatsProgress(0);
            });
        });
      });
  };

  useEffect(() => {
    if (goalsLoaded && currentUser) {
      fetchTodaysConsumption();
    }
  }, [goalsLoaded, currentUser]);

  const percentDailyGoals = (
    daily_calories,
    daily_protein,
    daily_carbs,
    daily_fats
  ) => {
    const percentCalories = ((daily_calories / calorieGoal) * 100).toFixed(1);
    const percentProtein = ((daily_protein / proteinGoal) * 100).toFixed(1);
    const percentCarbs = ((daily_carbs / carbGoal) * 100).toFixed(1);
    const percentFats = ((daily_fats / fatsGoal) * 100).toFixed(1);

    return { percentCalories, percentProtein, percentCarbs, percentFats };
  };

  const getProgressBarColor = (percentProgress) => {
    const percent = parseFloat(percentProgress);
    if (percent >= 75) {
      return "progress-bar-high";
    } else if (percent >= 50) {
      return "progress-bar-medium";
    } else if (percent >= 25) {
      return "progress-bar-low";
    } else {
      return "progress-bar-very-low";
    }
  };

  return (
    <div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={2}
        toastStyle={{
          "--toastify-color-progress-light": "#808080",
        }}
      />
      <h1>Nutritional Targets</h1>

      <h3 className="text-2xl font-medium underline text-gray-700 pt-2 pb-2">
        Daily Values:
      </h3>
      <div>
        <p className="text-lg text-gray-600"> Calorie Goal</p>
        <p>
          {caloriesConsumed.toFixed(2)}kcal / {calorieGoal}kcal
        </p>
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressBarColor(
              calorieProgress
            )} calorie`}
            style={{ width: `${calorieProgress}%` }}
          >
            {calorieProgress}% progress
          </div>
        </div>
      </div>

      <div>
        <p d="text-lg text-gray-600">Protein Goal</p>
        <p>
          {proteinConsumed.toFixed(2)}g / {proteinGoal}g
        </p>
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressBarColor(
              proteinProgress
            )} protein`}
            style={{ width: `${proteinProgress}%` }}
          >
            {proteinProgress}% progress
          </div>
        </div>
      </div>

      <div>
        <p className="text-lg text-gray-600">Carbs Goal</p>
        <p>
          {carbsConsumed.toFixed(2)}g / {carbGoal}g
        </p>
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressBarColor(
              carbProgress
            )} carb`}
            style={{ width: `${carbProgress}%` }}
          >
            {" "}
            {carbProgress}% progress
          </div>
        </div>
      </div>

      <div>
        <p className="text-lg text-gray-600">Fats Goal</p>
        <p>
          {fatsConsumed.toFixed(2)}g / {fatsGoal}g
        </p>
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressBarColor(fatsProgress)} fat`}
            style={{ width: `${fatsProgress}%` }}
          >
            {fatsProgress}% progress
          </div>
        </div>
      </div>

      <h3> Nutrition Info: </h3>

      <div>
        <p className="text-lg text-gray-600">BMR (Base Metabolic Rate)</p>
        <p>Minimum calories your body needs to function</p>
        <p>{bmr}</p>
      </div>

      <div>
        <p className="text-lg text-gray-600">
          TDEE (Total Daily Energy Expenditure)
        </p>
        <p>Total number of calories you body burns in a day</p>
        <p>{tdee}</p>
      </div>

      <script></script>
    </div>
  );
}
