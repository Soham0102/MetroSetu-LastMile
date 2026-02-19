export function getModeComparison(distance) {

  return [
    {
      mode: "Walk 🚶",
      time: Math.round(distance * 18) + " mins",
      cost: "Free",
      carbon: "Very High Saving",
      safety: "Medium"
    },
    {
      mode: "Shuttle 🚌",
      time: Math.round(distance * 10) + " mins",
      cost: "₹20",
      carbon: "High Saving",
      safety: "High"
    },
    {
      mode: "Auto 🚕",
      time: Math.round(distance * 7) + " mins",
      cost: "₹30",
      carbon: "Low Saving",
      safety: "Medium"
    }
  ];
}
