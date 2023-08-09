import { byRole } from "testing-library-selector"

export const makeCategory = (name: string) => byRole("region", { name })

export const category = byRole("region")
export const busesCategory = makeCategory("Buses")
export const locationsCategory = makeCategory("Locations")
