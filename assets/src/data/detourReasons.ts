export const detourReasons = [
  "Accident",
  "Construction",
  "Demonstration",
  "Disabled bus",
  "Drawbridge being raised",
  "Fire",
  "Hazmat condition",
  "Holiday",
  "Maintenance",
  "Medical emergency",
  "Parade",
  "Police activity",
  "Snow",
  "Special event",
  "Traffic",
  "Utility work",
  "Weather",
]

export const retiredDetourReasons = ["Electrical work", "Hurricane", "Tie replacement"]

// used for filtering the list of past detours
// contains both active and legacy detour reasons
export const historicalDetourReasons = [
  ...detourReasons,
  ...retiredDetourReasons,
].sort()
