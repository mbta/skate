import React, { useContext, useEffect } from "react"
import DispatchContext from "../contexts/dispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import { Route, Vehicle } from "../skate.d"
import { deselectVehicle } from "../state"
import CloseButton from "./closeButton"

interface Props {
  selectedVehicle: Vehicle
  selectedVehicleRoute?: Route
}

const Header = ({
  vehicle,
  selectedVehicleRoute,
  hideMe,
}: {
  vehicle: Vehicle
  selectedVehicleRoute?: Route
  hideMe: () => void
}) => (
  <div className="m-vehicle-properties-panel__header">
    <div className="m-vehicle-properties-panel__label">{vehicle.label}</div>
    <div className="m-vehicle-properties-panel__variant">
      <div className="m-vehicle-properties-panel__inbound-outbound">
        {directionName(vehicle, selectedVehicleRoute)}
      </div>
      <div className="m-vehicle-properties-panel__variant-name">
        {formatRouteVariant(vehicle)}
      </div>
    </div>
    <CloseButton onClick={hideMe} />
  </div>
)

const Properties = ({
  vehicle: { run_id, label, operator_id, operator_name },
}: {
  vehicle: Vehicle
}) => (
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
)

const Location = ({
  vehicle: { latitude, longitude, stop_status },
}: {
  vehicle: Vehicle
}) => (
  <div className="m-vehicle-properties-panel__location">
    <div className="m-vehicle-properties-panel__vehicle-property-label">
      Next Stop
    </div>
    <div className="m-vehicle-properties-panel__vehicle-property-value">
      {stop_status.stop_name}
    </div>
    <a
      className="m-vehicle-properties-panel__link"
      href={directionsUrl(latitude, longitude)}
    >
      Directions
    </a>
  </div>
)

const VehiclePropertiesPanel = ({
  selectedVehicle,
  selectedVehicleRoute,
}: Props) => {
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

  return (
    <>
      <div
        id="m-vehicle-properties-panel"
        className="m-vehicle-properties-panel"
      >
        <Header
          vehicle={selectedVehicle}
          selectedVehicleRoute={selectedVehicleRoute}
          hideMe={hideMe}
        />

        <Properties vehicle={selectedVehicle} />

        <Location vehicle={selectedVehicle} />

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

export const formatRouteVariant = (vehicle: Vehicle): string => {
  const { route_id: routeId, via_variant: viaVariant, headsign } = vehicle
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const headsignFormatted = headsign ? ` ${headsign}` : ""
  return `${routeId}_${viaVariantFormatted}${headsignFormatted}`
}

const directionName = (
  { direction_id }: Vehicle,
  selectedVehicleRoute?: Route
): string =>
  selectedVehicleRoute ? selectedVehicleRoute.directionNames[direction_id] : ""

const directionsUrl = (
  latitude: number,
  longitude: number
) => `https://www.google.com/maps/dir/?api=1\
&destination=${latitude.toString()},${longitude.toString()}\
&travelmode=driving`

export default VehiclePropertiesPanel
