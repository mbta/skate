import { byRole } from "testing-library-selector"

export const clearButton = byRole("button", {
  name: /clear search/i,
})
