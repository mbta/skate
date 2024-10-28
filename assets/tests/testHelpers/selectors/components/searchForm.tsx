import { byPlaceholderText, byRole } from "testing-library-selector"

export const clearButton = byRole("button", {
  name: /clear/i,
})

export const allFilter = byRole("radio", { name: "All" })
export const vehicleFilter = byRole("radio", { name: "Vehicles" })
export const operatorFilter = byRole("radio", { name: "Operators" })
export const runFilter = byRole("radio", { name: "Runs" })
export const locationFilter = byRole("radio", { name: "Locations" })

export const submitButton = byRole("button", { name: "Submit" })

export const searchInput = byPlaceholderText("Search")
