import { byRole } from "testing-library-selector"

export const searchFormClearSearchButton = byRole("button", {
  name: /clear search/i,
})
