import { useEffect, useState } from "react"

import L, { DivIcon, DivIconOptions as LeafletDivIconOptions } from "leaflet"

// Prevent user from setting parameters we intend to provide
export type DivIconOptions = Omit<LeafletDivIconOptions, "html">

// Prevent useEffect from triggering by providing stable default reference
const defaultOptions = {}

export function useReactDivIcon(options?: DivIconOptions) {
  const opts = options || defaultOptions
  // Persistent element for react portal to use between `divIcon` recreations
  const [iconContainer, setIconContainer] = useState<HTMLDivElement | null>(
    null
  )
  const [divIcon, setDivIcon] = useState<DivIcon>()

  // Create portal element and divIcon on creation and when `opts` change
  useEffect(() => {
    let element = iconContainer
    if (!element) {
      element = createPortalElement()
      setIconContainer(element)
    }

    // Leaflet doesn't support updating a `divIcon` in place.
    // To ensure that the `divIcon` updates when `opts` change
    // regenerate the `divIcon` with the portal element and provided `opts`
    if (element) {
      setDivIcon(L.divIcon({ ...opts, html: element }))
    }
  }, [opts, iconContainer])

  return {
    divIcon,
    iconContainer,
  }
}

// Extend this function or add more parameters to `useReactDivIcon` to override
// portal element creation
const createPortalElement = () => {
  const element = document.createElement("div")
  element.classList.add("w-100", "h-100")
  return element
}
