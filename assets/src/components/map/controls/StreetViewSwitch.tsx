import { ControlOptions } from "leaflet"
import React, { useEffect, useId, useState } from "react"
import { useMap } from "react-leaflet"

interface StreetViewControlProps extends ControlOptions {
  streetViewEnabled: boolean
  setStreetViewEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export const StreetViewControl = ({
  streetViewEnabled: streetViewEnabled,
  setStreetViewEnabled: setStreetViewEnabled,
}: StreetViewControlProps): JSX.Element | null => {
  const map = useMap()
  const portalParent = map
    .getContainer()
    .querySelector(".leaflet-control-container")
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
  const id = "street-view-toggle-" + useId()

  useEffect(() => {
    if (!portalParent || !portalElement) {
      setPortalElement(document.createElement("div"))
    }

    if (portalParent && portalElement) {
      portalElement.className =
        "leaflet-control leaflet-bar m-vehicle-map__street-view-control"
      portalParent.append(portalElement)
      Leaflet.DomEvent.disableClickPropagation(portalElement)
    }

    return () => portalElement?.remove()
  }, [portalElement, portalParent, setStreetViewEnabled])

  const control = (
    <>
      <label htmlFor={id}>
        <WalkingIcon />
        Street View
      </label>
      <div className="form-check form-switch">
        <input
          id={id}
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={streetViewEnabled}
          onChange={() => {
            // since the value is being toggled, the new value will be the opposite of the current value
            window.FS?.event("Dedicated street view toggled", {
              streetViewEnabled_bool: !streetViewEnabled,
            })

            setStreetViewEnabled((enabled) => !enabled)
          }}
        />
      </div>
    </>
  )

  return portalElement ? ReactDOM.createPortal(control, portalElement) : null
}
