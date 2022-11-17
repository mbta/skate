import React, { ReactElement, useContext } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { emptyLadderDirectionsByRouteId } from "../models/ladderDirection"
import { currentRouteTab } from "../models/routeTab"
import { directionName } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { Vehicle } from "../realtime"
import { secondsAgoLabel } from "../util/dateTime"
import CloseButton from "./closeButton"
import { RouteVariantName } from "./routeVariantName"
import StreetViewButton from "./streetViewButton"
import VehicleIcon, { Size, vehicleOrientation } from "./vehicleIcon"

const VehicleCard = ({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle
  onClose: () => void
}): ReactElement<HTMLElement> => {
  const [{ routeTabs, userSettings }] = useContext(StateDispatchContext)
  const epochNowInSeconds = useCurrentTimeSeconds()
  const route = useRoute(vehicle.routeId)

  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId

  return (
    <div className="vehicle-card">
      <VehicleIcon
        size={Size.Large}
        orientation={vehicleOrientation(vehicle, ladderDirections)}
        label={vehicleLabel(vehicle, userSettings)}
        variant={vehicle.viaVariant}
        status={drawnStatus(vehicle)}
        userSettings={userSettings}
      />
      <CloseButton onClick={onClose} closeButtonType={"s_light"} />
      {directionName(vehicle, route)}
      {secondsAgoLabel(epochNowInSeconds, vehicle.timestamp)}

      <RouteVariantName vehicle={vehicle} />

      <StreetViewButton
        latitude={vehicle.latitude}
        longitude={vehicle.longitude}
        bearing={vehicle.bearing}
      />
    </div>
  )
}
export default VehicleCard
