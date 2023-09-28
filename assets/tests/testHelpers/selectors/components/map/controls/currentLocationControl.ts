import { byRole } from "testing-library-selector"

export const currentLocationControl = byRole("button", {
  name: "Show your current location",
})
