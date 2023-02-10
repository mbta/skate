import { byRole } from "testing-library-selector"

export const routePropertiesCard = byRole("generic", {
  name: /route properties card/i,
})
