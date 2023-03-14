import { byRole } from "testing-library-selector"
export const streetViewModeSwitch = byRole("switch", { name: /Street View/ })
