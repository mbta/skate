import { byRole } from "testing-library-selector"

export const currentLocationMarker = byRole("button", {
  name: "Your current location",
})
