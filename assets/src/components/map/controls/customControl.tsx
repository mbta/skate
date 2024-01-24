import Leaflet, { ControlOptions, ControlPosition } from "leaflet"
import { ReactNode, useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { useMap } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"

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
  insertFirst,
}: ControlOptions & {
  children: ReactNode
  className?: string
  insertAfterSelector?: string
  insertFirst?: boolean
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

  console.debug(portalParent)
  console.debug(position)

  useEffect(() => {
    if (!portalElement) {
      setPortalElement(document.createElement("div"))
    }

    if (portalParent && portalElement) {
      portalElement.className = joinClasses(["leaflet-control", className])

      const elementToInsertAfter = insertAfterSelector
        ? portalParent.querySelector(insertAfterSelector)
        : null
      if (elementToInsertAfter) {
        elementToInsertAfter.after(portalElement)
      } else if (insertFirst) {
        portalParent.prepend(portalElement)
      } else {
        portalParent.append(portalElement)
      }
      Leaflet.DomEvent.disableClickPropagation(portalElement)
    }

    return () => portalElement?.remove()
  }, [portalElement, portalParent, className, insertAfterSelector, insertFirst])

  return portalElement ? ReactDOM.createPortal(children, portalElement) : null
}
