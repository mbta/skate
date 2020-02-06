import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import {
  directionOnLadder,
  getLadderDirectionForRoute,
  LadderDirection,
  VehicleDirection,
} from "../models/ladderDirection"
import { isVehicle } from "../models/vehicle"
import { onTimeStatus } from "../models/vehicleStatus"
import { Ghost, Vehicle, VehicleId, VehicleOrGhost } from "../realtime.d"
import { LoadableTimepoints, Route, RouteId } from "../schedule.d"
import { deselectRoute, flipLadder } from "../state"
import CloseButton from "./closeButton"
import IncomingBox from "./incomingBox"
import Ladder from "./ladder"
import LayoverBox, { LayoverBoxPosition } from "./layoverBox"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehiclesAndGhosts?: VehicleOrGhost[]
  selectedVehicleId: VehicleId | undefined
}

const Header = ({ route }: { route: Route }) => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="m-route-ladder__header">
      <CloseButton onClick={() => dispatch(deselectRoute(route.id))} />

      <div className="m-route-ladder__route-name">{route.name}</div>
    </div>
  )
}

const Controls = ({
  ladderDirection,
  reverseLadder,
}: {
  ladderDirection: LadderDirection
  reverseLadder: () => void
}) => (
  <div className="m-route-ladder__controls">
    <button className="m-route-ladder__reverse" onClick={reverseLadder}>
      {ladderDirection === LadderDirection.OneToZero
        ? reverseIcon("m-route-ladder__reverse-icon")
        : reverseIconReversed("m-route-ladder__reverse-icon")}
      Reverse
    </button>
  </div>
)

const RouteLadder = ({
  route,
  timepoints,
  vehiclesAndGhosts,
  selectedVehicleId,
}: Props) => {
  const [{ ladderDirections }, dispatch] = useContext(StateDispatchContext)
  const ladderDirection = getLadderDirectionForRoute(ladderDirections, route.id)
  const reverseLadder = () => {
    dispatch(flipLadder(route.id))
  }

  const byPosition: ByPosition = groupByPosition(
    vehiclesAndGhosts,
    route.id,
    ladderDirection
  )

  return (
    <>
      <Header route={route} />
      <Controls
        ladderDirection={ladderDirection}
        reverseLadder={reverseLadder}
      />

      {timepoints ? (
        <>
          <LayoverBox
            vehiclesAndGhosts={byPosition.layingOverTop}
            position={LayoverBoxPosition.Top}
          />
          <Ladder
            timepoints={timepoints}
            vehiclesAndGhosts={byPosition.onRoute}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <LayoverBox
            vehiclesAndGhosts={byPosition.layingOverBottom}
            position={LayoverBoxPosition.Bottom}
          />
          <IncomingBox
            vehiclesAndGhosts={byPosition.incoming}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
        </>
      ) : (
        <Loading />
      )}
    </>
  )
}

interface ByPosition {
  onRoute: VehicleOrGhost[]
  layingOverTop: VehicleOrGhost[]
  layingOverBottom: VehicleOrGhost[]
  incoming: VehicleOrGhost[]
}

export const groupByPosition = (
  vehiclesAndGhosts: VehicleOrGhost[] | undefined,
  routeId: RouteId,
  ladderDirection: LadderDirection
): ByPosition => {
  const realVehicles = (vehiclesAndGhosts || []).reduce(
    (acc: ByPosition, current: VehicleOrGhost) => {
      if (current.routeId === routeId) {
        switch (current.routeStatus) {
          case "on_route":
            return { ...acc, onRoute: [...acc.onRoute, current] }
          case "laying_over":
            if (
              directionOnLadder(current.directionId, ladderDirection) ===
              VehicleDirection.Up
            ) {
              return {
                ...acc,
                layingOverBottom: [...acc.layingOverBottom, current],
              }
            } else {
              return {
                ...acc,
                layingOverTop: [...acc.layingOverTop, current],
              }
            }
          case "pulling_out":
            return { ...acc, incoming: [...acc.incoming, current] }
          default:
            return acc
        }
      } else {
        // incoming from another route
        return { ...acc, incoming: [...acc.incoming, current] }
      }
    },
    {
      onRoute: [],
      layingOverTop: [],
      layingOverBottom: [],
      incoming: [],
    } as ByPosition
  )

  const vehiclesNeedingVirtualGhosts: Vehicle[] = [
    ...lateStartingIncomingVehicles(realVehicles.incoming, routeId),
    ...lateStartingLayingOverVehicles([
      ...realVehicles.layingOverTop,
      ...realVehicles.layingOverBottom,
    ]),
  ]
  const incomingGhosts: Ghost[] = vehiclesNeedingVirtualGhosts.map(vehicle =>
    ghostFromVehicleScheduledLocation(vehicle)
  )

  return {
    ...realVehicles,
    onRoute: [...realVehicles.onRoute, ...incomingGhosts],
  }
}

const lateStartingIncomingVehicles = (
  incomingVehiclesOrGhosts: VehicleOrGhost[],
  currentRouteId: RouteId
): Vehicle[] =>
  incomingVehiclesOrGhosts.filter(
    vehicleOrGhost =>
      isAVehicleThatIsLateStartingScheduledTrip(vehicleOrGhost) &&
      isScheduledForCurrentRoute(vehicleOrGhost as Vehicle, currentRouteId)
  ) as Vehicle[]

const lateStartingLayingOverVehicles = (
  layingOverVehiclesOrGhosts: VehicleOrGhost[]
): Vehicle[] =>
  layingOverVehiclesOrGhosts.filter(
    vehicleOrGhost =>
      isAVehicleThatIsLateStartingScheduledTrip(vehicleOrGhost) &&
      isScheduledForCurrentTrip(vehicleOrGhost as Vehicle)
  ) as Vehicle[]

const isAVehicleThatIsLateStartingScheduledTrip = (
  vehicleOrGhost: VehicleOrGhost
): boolean =>
  isVehicle(vehicleOrGhost) &&
  hasAScheduleLocation(vehicleOrGhost) &&
  isLateStartingScheduledTrip(vehicleOrGhost)

const isScheduledForCurrentRoute = (
  vehicle: Vehicle,
  currentRouteId: RouteId
): boolean => vehicle.scheduledLocation!.routeId === currentRouteId

const isScheduledForCurrentTrip = (vehicle: Vehicle): boolean =>
  vehicle.tripId === vehicle.scheduledLocation!.tripId

const hasAScheduleLocation = (vehicle: Vehicle): boolean =>
  vehicle.scheduledLocation != null

const isLateStartingScheduledTrip = (vehicle: Vehicle): boolean =>
  onTimeStatus(vehicle.scheduledLocation!.timeSinceTripStartTime) === "late"

const ghostFromVehicleScheduledLocation = (vehicle: Vehicle): Ghost => ({
  id: `ghost-incoming-${vehicle.id}`,
  directionId: vehicle.scheduledLocation!.directionId,
  routeId: vehicle.scheduledLocation!.routeId,
  tripId: vehicle.scheduledLocation!.tripId,
  headsign: vehicle.scheduledLocation!.headsign || "",
  blockId: vehicle.blockId,
  runId: vehicle.scheduledLocation!.runId,
  viaVariant: vehicle.scheduledLocation!.viaVariant,
  layoverDepartureTime: null,
  scheduledTimepointStatus: vehicle.scheduledLocation!.timepointStatus,
  routeStatus: "on_route",
})

export default RouteLadder
