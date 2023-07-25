import { byPlaceholderText, byRole } from "testing-library-selector"

export const clearButton = byRole("button", {
  name: /clear/i,
})

export const vehicleFilter = byRole("button", { name: "Vehicles" })
export const operatorFilter = byRole("button", { name: "Operators" })
export const runFilter = byRole("button", { name: "Runs" })
export const locationFilter = byRole("button", { name: "Locations" })

export const submitButton = byRole("button", { name: "Submit" })

export const searchInput = byPlaceholderText("Search")
