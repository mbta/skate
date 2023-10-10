import { byRole } from "testing-library-selector"

export const recenterControl = byRole("button", { name: /recenter map/i })
