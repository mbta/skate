import { byRole } from "testing-library-selector"
export const vehiclePropertiesCard = byRole("generic", {
  name: /vehicle properties card/i,
})
