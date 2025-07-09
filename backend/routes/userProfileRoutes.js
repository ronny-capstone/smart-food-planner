const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const { STATUS_CODES } = require("http");
const checkInvalidVariable = require("../utils/invalidVars.jsx");
const { calculateBMR, calculateTDEE } = require("../utils/healthCalc.jsx");
const StatusCodes = require("http-status-codes").StatusCodes;

const profileRoutes = express.Router();
const dbPath = path.resolve(__dirname, "../db/fridge.db");

const db = new sqlite3.Database(dbPath);

// Create/update user profile
profileRoutes.post("/", (req, res) => {
  const {
    id,
    health_goal,
    dietary_preferences,
    age,
    weight_kg,
    height_feet,
    height_inches,
    gender,
    activity,
  } = req.body;
  if (
    checkInvalidVariable(id) ||
    checkInvalidVariable(health_goal) ||
    checkInvalidVariable(dietary_preferences) ||
    checkInvalidVariable(age) ||
    checkInvalidVariable(weight_kg) ||
    checkInvalidVariable(height_feet) ||
    checkInvalidVariable(height_inches) ||
    checkInvalidVariable(gender) ||
    checkInvalidVariable(activity)
  ) {
    return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: "Missing required fields" });
  }

  const bmr = calculateBMR(gender, age, weight_kg, height_feet, height_inches);
  const tdee = calculateTDEE(
    gender,
    age,
    activity,
    weight_kg,
    height_feet,
    height_inches
  );
  const macroTargets = calculateMacroTargets(tdee, health_goal, weight_kg);

  // Check if user's profile already exists
  try {
    db.get(
      "SELECT profile_completed FROM users WHERE id = ?",
      [id],
      async (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Error fetching user profile" });
        }
        // If user's profile exists, update the profile
        if (row) {
          try {
            db.query(
              `UPDATE users SET health_goal = ?, dietary_preferences = ?, age = ?, weight_kg = ?, height_feet = ?, height_inches = ?, gender = ?, activity = ?, bmr = ?, tdee = ?, profile_completed = true WHERE id = ?`,
              [
                health_goal,
                dietary_preferences,
                age,
                weight_kg,
                height_feet,
                height_inches,
                gender,
                activity,
                bmr,
                tdee,
                id,
              ],
              function (err) {
                if (err) {
                  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message:
                      "An error occurred while updating the user profile",
                  });
                }
                return res
                  .status(StatusCodes.OK)
                  .json({ message: "Profile updated successfully" });
              }
            );
          } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message: "An error occurred during profile update",
            });
          }
        } else {
          // Create a new user profile
          try {
            db.run(
              `INSERT INTO users (id, health_goal, dietary_preferences, age, weight_kg, height_feet, height_inches, gender, activity, bmr, tdee, profile_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                health_goal,
                dietary_preferences,
                age,
                weight_kg,
                height_feet,
                height_inches,
                gender,
                activity,
                bmr,
                tdee,
                true,
              ],
              function (err) {
                if (err) {
                  return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: "Unable to sign up. Please try again" });
                }
              }
            );
          } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message: "An error occurred while creating a user profile",
              error: err.message,
            });
          }
        }
        return res
          .status(StatusCodes.CREATED)
          .send("Profile creation successful!");
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong during profile creation",
    });
  }
});

// Update user's profile
profileRoutes.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      health_goal,
      dietary_preferences,
      age,
      weight_kg,
      height_feet,
      height_inches,
      gender,
      activity,
      bmr,
      tdee,
    } = req.body;

    if (
      checkInvalidVariable(id) ||
      checkInvalidVariable(health_goal) ||
      checkInvalidVariable(dietary_preferences) ||
      checkInvalidVariable(age) ||
      checkInvalidVariable(weight_kg) ||
      checkInvalidVariable(height_feet) ||
      checkInvalidVariable(height_inches) ||
      checkInvalidVariable(gender) ||
      checkInvalidVariable(activity) ||
      checkInvalidVariable(bmr) ||
      checkInvalidVariable(tdee)
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Missing required fields" });
    }

    // Update BMR and TDEE with new information
    const updatedBmr = calculateBMR(
      gender,
      age,
      weight_kg,
      height_feet,
      height_inches
    );
    const updatedTdee = calculateTDEE(
      gender,
      age,
      activity,
      weight_kg,
      height_feet,
      height_inches
    );
    const macroTargets = calculateMacroTargets(tdee, health_goal, weight_kg);

    try {
      db.get(
        "SELECT profile_completed FROM users WHERE id = ?",
        [id],
        async (err, row) => {
          if (err) {
            return res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ message: "Error fetching user profile" });
          }
          if (!row) {
            return res
              .status(StatusCodes.NOT_FOUND)
              .json({ message: "User not found" });
          }

          try {
            db.query(
              `UPDATE users SET health_goal = ?, dietary_preferences = ?, age = ?, weight_kg = ?, height_feet = ?, height_inches = ?, gender = ?, activity = ?, calorie_goal = ?, protein_goal = ?, carb_goal = ?, fat_goal = ?, bmr = ?, tdee = ?, profile_completed = true WHERE id = ?`,
              [
                health_goal,
                dietary_preferences,
                age,
                weight_kg,
                height_feet,
                height_inches,
                gender,
                activity,
                calorie_goal,
                protein_goal,
                carb_goal,
                fat_goal,
                updatedBmr,
                updatedTdee,
                id,
              ],
              function (err) {
                if (err) {
                  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message:
                      "An error occurred while updating the user profile",
                  });
                }
                return res
                  .status(StatusCodes.OK)
                  .json({ message: "Profile updated successfully" });
              }
            );
          } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message: "An error occurred during profile update",
            });
          }
        }
      );
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "An error occurred while updating grocery item",
      });
    }
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred in the profile update route",
    });
  }
});

// Get specific user's profile
profileRoutes.get("/:id", (req, res) => {
  const { id } = req.params;

  try {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Error getting user's profile" });
      }
      if (!row) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User profile not found" });
      }

      return res.status(StatusCodes.OK).json({ profile: row });
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching user profile",
    });
  }
});

module.exports = profileRoutes;
