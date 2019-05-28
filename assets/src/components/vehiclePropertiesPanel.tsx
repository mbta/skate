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
  const {
    label,
    run_id,
    longitude,
    latitude,
    route_id,
    headsign,
    via_variant,
    operator_id,
    operator_name,
    stop_status,
  } = selectedVehicle

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
&destination=${latitude.toString()},${longitude.toString()}\
&travelmode=driving`

  const routeVariantText: string = formatRouteVariant(
    route_id,
    via_variant,
    headsign
  )

  return (
    <>
      <div
        id="m-vehicle-properties-panel"
        className="m-vehicle-properties-panel"
      >
        <div className="m-vehicle-properties-panel__header">
          <div className="m-vehicle-properties-panel__label">{label}</div>
          <div className="m-vehicle-properties-panel__variant">
            {routeVariantText}
          </div>
          <CloseButton onClick={hideMe} />
        </div>

        <table className="m-vehicle-properties-panel__vehicle-properties">
          <tbody>
            <tr>
              <th className="m-vehicle-properties-panel__vehicle-property-label">
                Run
              </th>
              <td className="m-vehicle-properties-panel__vehicle-property-value">
                {run_id}
              </td>
            </tr>
            <tr>
              <th className="m-vehicle-properties-panel__vehicle-property-label">
                Vehicle
              </th>
              <td className="m-vehicle-properties-panel__vehicle-property-value">
                {label}
              </td>
            </tr>
            <tr>
              <th className="m-vehicle-properties-panel__vehicle-property-label">
                Operator
              </th>
              <td className="m-vehicle-properties-panel__vehicle-property-value">
                {operator_name} #{operator_id}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="m-vehicle-properties-panel__location">
          <div className="m-vehicle-properties-panel__vehicle-property-label">
            Next Stop
          </div>
          <div className="m-vehicle-properties-panel__vehicle-property-value">
            {stop_status.stop_name}
          </div>
          <a className="m-vehicle-properties-panel__link" href={directionsUrl}>
            Directions
          </a>
        </div>

        <button className="m-vehicle-properties-panel__close" onClick={hideMe}>
          Close
        </button>
      </div>

      <div
        className="m-vehicle-properties-panel__modal-overlay"
        onClick={hideMe}
      />
    </>
  )
}

export const formatRouteVariant = (
  routeId: RouteId,
  viaVariant: ViaVariant | null,
  headsign: string | null
): string => {
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const headsignFormatted = headsign ? ` ${headsign}` : ""
  return `${routeId}_${viaVariantFormatted}${headsignFormatted}`
}

export default VehiclePropertiesPanel
