// src/utils/emergencyLogic.js

export const getEmergencyStatus = (monthsCovered, targetMonths = 6) => {
  // Calculate the "Health Ratio" (0 to 1+)
  // How close are we to the user's SPECIFIC goal?
  const healthRatio = monthsCovered / targetMonths;

  if (monthsCovered < 1) {
    return {
      status: "At Critical Risk",
      color: "#ef4444", // Red
      icon: "🚨",
      advice: "You have less than a month of buffer. Prioritize liquid savings immediately."
    };
  }

  if (healthRatio < 0.5) {
    return {
      status: "Building Foundation",
      color: "#f97316", // Orange
      icon: "🏗️",
      advice: `You're below 50% of your ${targetMonths}-month goal. Keep consistent contributions.`
    };
  }

  if (healthRatio < 1) {
    return {
      status: "Gaining Stability",
      color: "#eab308", // Yellow
      icon: "🛡️",
      advice: `Almost there! You have covered ${monthsCovered.toFixed(1)} months out of your ${targetMonths} month target.`
    };
  }

  if (healthRatio >= 1) {
    return {
      status: "Fully Protected",
      color: "#22c55e", // Green
      icon: "🦉",
      advice: `Goal achieved! With ${monthsCovered.toFixed(1)} months covered, your extra cash can now be invested.`
    };
  }
};