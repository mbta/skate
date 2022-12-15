import React, { ReactElement, useContext } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { useNearestIntersection } from "../hooks/useNearestIntersection"
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

const VehiclePropertiesCard = ({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle
  onClose: () => void
}): ReactElement<HTMLElement> => {
  const [{ routeTabs, userSettings }] = useContext(StateDispatchContext)
  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId
  const epochNowInSeconds = useCurrentTimeSeconds()
  const route = useRoute(vehicle.routeId)

  const { latitude, longitude } = vehicle
  const nearestIntersection: string | null = useNearestIntersection(
    latitude,
    longitude
  )

  return (
    <div className="m-vehicle-card">
      <div className="m-vehicle-card__icon">
        <VehicleIcon
          size={Size.Large}
          orientation={vehicleOrientation(vehicle, ladderDirections)}
          label={vehicleLabel(vehicle, userSettings)}
          variant={vehicle.viaVariant}
          status={drawnStatus(vehicle)}
          userSettings={userSettings}
        />
      </div>
      <div>
        <div className="m-vehicle-card__header">
          <div className="m-vehicle-card__header-contents">
            <div>
              <div>{directionName(vehicle, route)}</div>
              <RouteVariantName vehicle={vehicle} />
            </div>
            <div>{secondsAgoLabel(epochNowInSeconds, vehicle.timestamp)}</div>
          </div>
          <div>
            <CloseButton onClick={onClose} closeButtonType={"s_light"} />
          </div>
        </div>
        <div className="m-vehicle-card__content">
          {nearestIntersection && (
            <div className="m-vehicle-card__location">
              <div className="m-vehicle-card__location-label">
                Current Location
              </div>
              {nearestIntersection}
            </div>
          )}
          <StreetViewButton
            latitude={vehicle.latitude}
            longitude={vehicle.longitude}
            bearing={vehicle.bearing}
          />
        </div>
      </div>
    </div>
  )
}
export default VehiclePropertiesCard
