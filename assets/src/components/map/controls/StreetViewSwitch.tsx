import Leaflet, { ControlOptions } from "leaflet"
import React, { useEffect, useId, useState } from "react"
import ReactDOM from "react-dom"
import { useMap, useMapEvents } from "react-leaflet"
import { className } from "../../../helpers/dom"
import { WalkingIcon } from "../../../helpers/icon"
import { streetViewUrl } from "../../../util/streetViewUrl"

export interface StreetViewControlProps extends ControlOptions {
  streetViewEnabled: boolean
  setStreetViewEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export const StreetViewControl = ({
  streetViewEnabled,
  setStreetViewEnabled,
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
      portalElement.className = className([
        "leaflet-control",
        "leaflet-bar",
        "lc-street-view-switch",
      ])
      portalParent.append(portalElement)
      Leaflet.DomEvent.disableClickPropagation(portalElement)
    }

    return () => portalElement?.remove()
  }, [portalElement, portalParent, setStreetViewEnabled])

  useMapEvents(
    streetViewEnabled
      ? {
          click: (e) => {
            window.open(
              streetViewUrl({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
              }),
              "_blank"
            )
            setStreetViewEnabled(false)
          },

          keydown: (e) => {
            if (e.originalEvent.key === "Escape") {
              setStreetViewEnabled(false)
            }
          },
        }
      : {}
  )

  const control = (
    <>
      <label
        htmlFor={id}
        className="lc-street-view-switch__label"
        aria-label=""
        aria-hidden={true}
        role="presentation"
      >
        <WalkingIcon className="lc-street-view-switch__label-icon" />
      </label>
      <label
        htmlFor={id}
        className="lc-street-view-switch__label lc-street-view-switch__label-text"
      >
        Street View
      </label>
      <div className="form-check form-switch lc-street-view-switch__input">
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
