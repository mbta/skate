import React, { useContext, useEffect } from "react"
import DispatchContext from "../contexts/dispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import { RouteId, Vehicle, ViaVariant } from "../skate.d"
import { deselectVehicle } from "../state"
import CloseButton from "./closeButton"

interface Props {
  selectedVehicle: Vehicle
}

const VehiclePropertiesPanel = ({ selectedVehicle }: Props) => {
  const dispatch = useContext(DispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  useEffect(() => {
    const handleSwipe = (swipeDirection: SwipeDirection) => {
      if (swipeDirection === "Right") {
        hideMe()
      }
    }

    return detectSwipe("m-vehicle-properties-panel", handleSwipe)
  })

  const directionsUrl = `https://www.google.com/maps/dir/?api=1\
&destination=${selectedVehicle.latitude.toString()},${selectedVehicle.longitude.toString()}\
&travelmode=driving`

  const titleText: string = routeVariantText(
    selectedVehicle.route_id,
    selectedVehicle.via_variant,
    selectedVehicle.headsign
  )

  return (
    <>
      <div
        id="m-vehicle-properties-panel"
        className="m-vehicle-properties-panel"
      >
        <div className="m-vehicle-properties-panel__header">
          <div className="m-vehicle-properties-panel__title">{titleText}</div>
          <CloseButton onClick={hideMe} />
        </div>

        <dl className="m-vehicle-properties-panel__vehicle-properties">
          <div
            role="listitem"
            className="m-vehicle-properties-panel__vehicle-property"
          >
            <dt className="m-vehicle-properties-panel__vehicle-property-label">
              Vehicle
            </dt>
            <dd className="m-vehicle-properties-panel__vehicle-property-value">
              {selectedVehicle.label}
            </dd>
          </div>
        </dl>

        <hr className="m-vehicle-properties-panel__divider" />

        <a className="m-vehicle-properties-panel__link" href={directionsUrl}>
          Directions
        </a>

        <button className="m-vehicle-properties-panel__close" onClick={hideMe}>
          Close vehicle properties
        </button>
      </div>

      <div
        className="m-vehicle-properties-panel__modal-overlay"
        onClick={hideMe}
      />
    </>
  )
}

export const routeVariantText = (
  routeId: RouteId,
  viaVariant: ViaVariant | null,
  headsign: string | null
): string => {
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const headsignFormatted = headsign ? ` ${headsign}` : ""
  return `${routeId}_${viaVariantFormatted}${headsignFormatted}`
}

export default VehiclePropertiesPanel
