const heightToCm = (feet, inches) => {
  const feetNum = parseInt(feet);
  const inchesNum = parseInt(inches);

  const totalInches = feetNum * 12 + inchesNum;
  return Math.round(totalInches * 2.54);
};

const calculateBMR = (gender, age, weight_kg, height_feet, height_inches) => {
  if (gender === "woman") {
    return (
      447.593 +
      9.247 * weight_kg +
      3.098 * heightToCm(height_feet, height_inches) -
      4.33 * age
    );
  } else {
    return (
      88.362 +
      13.397 * weight_kg +
      4.799 * heightToCm(height_feet, height_inches) -
      5.677 * age
    );
  }
};

const calculateTDEE = (
  gender,
  age,
  activity,
  weight_kg,
  height_feet,
  height_inches
) => {
  const bmr = 0;
  if (gender === "woman") {
    bmr =
      (10 * weight_kg) +
      (6.25 * heightToCm(height_feet, height_inches)) -
      (5 * age) -
      161;
  } else {
    bmr =
      (10 * weight_kg) +
      (6.25 * heightToCm(height_feet, height_inches)) -
      (5 * age) +
      5;
  }

  if (activity === "Sedentary") {
    return bmr * 1.2;
  } else if (activity === "Lightly active") {
    return bmr * 1.375;
  } else if (activity === "Moderately active") {
    return bmr * 1.55;
  } else if (activity === "Active") {
    return bmr * 1.725;
  } else if (activity === "Very active") {
    return bmr * 1.9;
  }
};

module.exports = { calculateBMR, calculateTDEE };
