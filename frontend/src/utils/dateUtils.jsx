export const formatDateString = (dateString) => {
  const [year, month, day] = dateString.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getDaysUntilExpiration = (expirationDate) => {
  const today = new Date();
  const expireDate = new Date(expirationDate);
  const timeDifference = expireDate.getTime() - today.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return daysDifference;
};

export const getExpirationStatus = (expirationDate) => {
  const days = getDaysUntilExpiration(expirationDate);
  if (days < 0) {
    return "Expired";
  } else if (days <= 3) {
    return "Expiring soon";
  } else if (days <= 7) {
    return "Expiring this week";
  }
  return "Fresh";
};

export const formatDay = (days) => {
  const dayString = days === 1 ? "day" : "days";
  return `${Math.abs(days)} ${dayString}`;
};

import { capitalize } from "./stringUtils";
export const mealDayColor = (dayNum, mealType) => {
  console.log(dayNum, mealType);
  if (dayNum === 1) {
    return <p className="text-xl text-red-500">{capitalize(mealType)}</p>;
  }
  if (dayNum === 2) {
    return <p className="text-xl text-orange-500">{capitalize(mealType)}</p>;
  } else if (dayNum === 3) {
    return <p className="text-xl text-yellow-500">{capitalize(mealType)}</p>;
  } else if (dayNum === 4) {
    return <p className="text-xl text-green-500">{capitalize(mealType)}</p>;
  } else if (dayNum === 5) {
    return <p className="text-xl text-sky-500">{capitalize(mealType)}</p>;
  } else if (dayNum === 6) {
    return <p className="text-xl text-indigo-500">{capitalize(mealType)}</p>;
  } else if (dayNum === 7) {
    return <p className="text-xl text-purple-500">{capitalize(mealType)}</p>;
  }
};
