import Leaflet, { ControlOptions, ControlPosition } from "leaflet"
import { ReactNode, useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { useMap } from "react-leaflet"

const positionQuerySelector = (position: ControlPosition) => {
  switch (position) {
    case "topleft":
      return ".leaflet-top.leaflet-left"
    case "topright":
      return ".leaflet-top.leaflet-right"
    case "bottomleft":
      return ".leaflet-bottom.leaflet-left"
    case "bottomright":
      return ".leaflet-bottom.leaflet-right"
  }
}

export const CustomControl = ({
  position,
  children,
  className,
  insertAfterSelector,
}: ControlOptions & {
  children: ReactNode
  className: string
  insertAfterSelector?: string
}): JSX.Element | null => {
  const map = useMap()
  const portalParent = map
    .getContainer()
    .querySelector(
      `.leaflet-control-container ${
        position ? positionQuerySelector(position) : ""
      }`
    )
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!portalElement) {
      setPortalElement(document.createElement("div"))
    }

    if (portalParent && portalElement) {
      portalElement.className = `leaflet-control ${className}`

      const elementToInsertAfter = insertAfterSelector
        ? portalParent.querySelector(insertAfterSelector)
        : null
      if (elementToInsertAfter) {
        elementToInsertAfter.after(portalElement)
      } else {
        portalParent.append(portalElement)
      }
      Leaflet.DomEvent.disableClickPropagation(portalElement)
    }

    return () => portalElement?.remove()
  }, [portalElement, portalParent, className, insertAfterSelector])

  return portalElement ? ReactDOM.createPortal(children, portalElement) : null
}
