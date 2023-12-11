import Leaflet, { ControlOptions } from "leaflet"
import React, { useEffect, useId, useState } from "react"
import ReactDOM from "react-dom"
import { useMap, useMapEvents } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"
import { WalkingIcon } from "../../../helpers/icon"
import { streetViewUrl } from "../../../util/streetViewUrl"
import { CutoutOverlay } from "../../cutoutOverlay"
import { fullStoryEvent } from "../../../helpers/fullStory"
import { Form } from "react-bootstrap"

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

  useEffect(() => {
    if (!portalParent || !portalElement) {
      setPortalElement(document.createElement("div"))
    }

    if (portalParent && portalElement) {
      portalElement.className = joinClasses([
        "leaflet-control",
        "leaflet-bar",
        "c-street-view-switch",
        "position-absolute",
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
            const source = {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
              },
              url = streetViewUrl(source)

            fullStoryEvent("User clicked map to open street view", {
              streetViewUrl_str: url,
              clickedMapAt: {
                latitude_real: source.latitude,
                longitude_real: source.longitude,
              },
            })

            window.open(url, "_blank")
          },

          keydown: (e) => {
            if (e.originalEvent.key === "Escape") {
              setStreetViewEnabled(false)
            }
          },
        }
      : {}
  )

  return (
    <>
      {portalElement &&
        ReactDOM.createPortal(
          <StreetViewSwitch
            streetViewEnabled={streetViewEnabled}
            setStreetViewEnabled={setStreetViewEnabled}
          />,
          portalElement
        )}
      {streetViewEnabled && <CutoutOverlay.FollowMapMouseMove />}
    </>
  )
}

export const StreetViewSwitch = ({
  streetViewEnabled,
  setStreetViewEnabled,
}: StreetViewControlProps) => {
  const id = "street-view-toggle-" + useId()

  return (
    <>
      <label
        htmlFor={id}
        className="c-street-view-switch__label"
        aria-label=""
        aria-hidden={true}
        role="presentation"
      >
        <WalkingIcon className="c-street-view-switch__label-icon" />
      </label>
      <label
        htmlFor={id}
        className="c-street-view-switch__label c-street-view-switch__label-text stretched-link"
      >
        Street View
      </label>
      <Form.Check
        type="switch"
        id={id}
        className="c-street-view-switch__input"
        role="switch"
        checked={streetViewEnabled}
        onChange={() => {
          // since the value is being toggled, the new value will be the opposite of the current value
          fullStoryEvent("Dedicated street view toggled", {
            streetViewEnabled_bool: !streetViewEnabled,
          })

          setStreetViewEnabled((enabled) => !enabled)
        }}
      />
    </>
  )
}
