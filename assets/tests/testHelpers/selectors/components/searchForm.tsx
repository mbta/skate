import { byPlaceholderText, byRole } from "testing-library-selector"

export const clearButton = byRole("button", {
  name: /clear/i,
})

export const submitButton = byRole("button", { name: "Submit" })

export const searchInput = byPlaceholderText("Search")
