import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH } from "../utils/paths";
import { checkInvalidVariable } from "../utils/invalidVars";
import { toast } from "react-toastify";

export default function ProfileForm({ profileSubmit, currentUser }) {
  // Determines if user is updating an existing profile or creating new one
  const [isUpdating, setIsUpdating] = useState(false);
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightKg, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [healthGoal, setHealthGoal] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState("");

  // When currentUser is set, determine if user is logging in / signing up
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
        // User is updating their profile
        setIsUpdating(true);
        // Sets state to a string if value is undefined
        setHeightFeet(data.profile.height_feet ?? "");
        setHeightInches(data.profile.height_inches ?? "");
        setWeight(data.profile.weight_kg ?? "");
        setAge(data.profile.age ?? "");
        setGender(data.profile.gender ?? "");
        setActivityLevel(data.profile.activity ?? "");
        setHealthGoal(data.profile.health_goal ?? "");
        setDietaryPreferences(data.profile.dietary_preferences ?? "");
      })
      .catch((err) => {
        // User is creating their profile
        setIsUpdating(false);
        setHeightFeet("");
        setHeightInches("");
        setWeight("");
        setAge("");
        setGender("");
        setActivityLevel("");
        setHealthGoal("");
        setDietaryPreferences("");
      });
    // Run this whenever currentUser changes
  }, [currentUser]);

  const handleSubmit = async (e) => {
    // Stops page from refreshing
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please log in");
      return;
    }
    if (
      checkInvalidVariable(heightFeet) ||
      checkInvalidVariable(heightInches) ||
      checkInvalidVariable(weightKg) ||
      checkInvalidVariable(age) ||
      checkInvalidVariable(gender) ||
      checkInvalidVariable(activityLevel) ||
      checkInvalidVariable(healthGoal) ||
      checkInvalidVariable(dietaryPreferences)
    ) {
      toast.error("Please fill out all fields");
      return;
    }

    const endpoint = isUpdating
      ? `${API_BASE_URL}${PROFILE_PATH}/${currentUser}`
      : `${API_BASE_URL}${PROFILE_PATH}`;
    const method = isUpdating ? "PATCH" : "POST";

    // Make API request to create or update profile
    const response = await fetch(endpoint, {
      method: method,

      body: JSON.stringify({
        id: currentUser,
        health_goal: healthGoal,
        dietary_preferences: dietaryPreferences,
        age: parseInt(age),
        weight_kg: parseInt(weightKg),
        height_feet: parseInt(heightFeet),
        height_inches: parseInt(heightInches),
        gender: gender,
        activity: activityLevel,
      }),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Server error");
        }
        return response.json();
      })
      .then((data) => {
        console.log("profile update response:", data);
        // Reset form
        if (!isUpdating) {
          setHeightFeet("");
          setHeightInches("");
          setWeight("");
          setAge("");
          setGender("");
          setActivityLevel("");
          setHealthGoal("");
          setDietaryPreferences("");
        }
        toast.success(
          `Profile ${isUpdating ? "updated" : "created"} successfully`
        );
        if (profileSubmit) {
          profileSubmit();
        }
      })
      .catch((err) => {
        console.error("Profile update error", err);
        toast.error(`Failed to ${isUpdating ? "update" : "create"} profile`);
      });
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-6">
          <h1 className="font-semibold text-gray-900 mb-2">
            {isUpdating ? "Update Profile" : "Create Profile"}
          </h1>
          <p className="text-gray-600">
            {" "}
            {isUpdating ? "Update your information" : "Tell us about yourself"}
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={heightFeet}
                placeholder="Feet"
                onChange={(e) => setHeightFeet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={heightInches}
                placeholder="Inches"
                onChange={(e) => setHeightInches(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="text"
              value={weightKg}
              placeholder={"Weight in kilograms"}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="text"
              value={age}
              placeholder={"Age"}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value=""> Select gender </option>

            <option value={"Male"}>Male</option>
            <option value={"Female"}>Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Level
          </label>
          <select
            name="activityLevel"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value=""> Select activity Level </option>

            <option value={"Sedentary"}>Sedentary (no exercise)</option>
            <option value={"Lightly active"}>
              Lightly active (1-2 days/week){" "}
            </option>
            <option value={"Moderately active"}>
              Moderately active (3-5 days/week)
            </option>
            <option value={"Active"}>Very active (6-7 days/week)</option>
            <option value={"Very active"}>Athlete (2x day) </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Preferences
          </label>
          <select
            name="dietaryPreference"
            value={dietaryPreferences}
            onChange={(e) => setDietaryPreferences(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value=""> Select dietary preference </option>
            <option value={"None"}>None</option>
            <option value={"Vegetarian"}>Vegetarian</option>
            <option value={"Vegan"}>Vegan</option>
            <option value={"Gluten free"}>Gluten-free</option>
            <option value={"Ketogenic"}>Ketogenic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Health Goal
          </label>

          <select
            name="healthGoal"
            value={healthGoal}
            onChange={(e) => setHealthGoal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value=""> Select health goal </option>
            <option value={"Lose Weight"}>Lose weight</option>
            <option value={"Gain Weight"}>Gain weight</option>
            <option value={"Maintain Weight"}>Maintain weight</option>
          </select>
        </div>

        {isUpdating ? (
          <button
            type="submit"
            id="editBtn"
            onClick={handleSubmit}
            className="w-full !bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 mt-4 rounded-lg"
          >
            Update Profile
          </button>
        ) : (
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full !bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 mt-4 rounded-lg"
          >
            Create Profile
          </button>
        )}
      </form>
    </div>
  );
}
