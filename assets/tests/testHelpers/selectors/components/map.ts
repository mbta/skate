import { byRole } from "testing-library-selector"

export const zoomInButton = byRole("button", { name: "Zoom in" })

export const zoomOutButton = byRole("button", { name: "Zoom out" })

export const layersControlButton = byRole("button", { name: "Layers" })

export const pullbacksSwitch = byRole("switch", { name: "Show pull-backs" })
