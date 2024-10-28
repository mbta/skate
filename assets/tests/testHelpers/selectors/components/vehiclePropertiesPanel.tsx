import { byRole } from "testing-library-selector"

export const vehiclePropertiesPanelHeader = byRole("heading", {
  name: "Vehicles",
  level: 2,
})
