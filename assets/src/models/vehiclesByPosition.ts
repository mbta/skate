import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "../models/ladderDirection"
import { isVehicle } from "../models/vehicle"
import { onTimeStatus } from "../models/vehicleStatus"
import { Ghost, RunId, Vehicle, VehicleOrGhost } from "../realtime.d"
import { RouteId } from "../schedule.d"

/**
 * Groups vehicles and ghosts by where they should be drawn on the route ladder
 */
export interface VehiclesByPosition {
  onRoute: VehicleOrGhost[]
  layingOverTop: VehicleOrGhost[]
  layingOverBottom: VehicleOrGhost[]
  incoming: VehicleOrGhost[]
}

export const groupByPosition = (
  vehiclesAndGhosts: VehicleOrGhost[] | undefined,
  routeId: RouteId,
  ladderDirection: LadderDirection
): VehiclesByPosition => {
  const realVehicles = (vehiclesAndGhosts || []).reduce(
    (acc: VehiclesByPosition, current: VehicleOrGhost) => {
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
    } as VehiclesByPosition
  )

  const vehiclesNeedingVirtualGhosts: Vehicle[] = [
    ...lateStartingIncomingVehicles(realVehicles.incoming, routeId),
    ...lateStartingLayingOverVehicles([
      ...realVehicles.layingOverTop,
      ...realVehicles.layingOverBottom,
    ]),
  ].filter(runNotSharedByAnotherVehicle(vehiclesAndGhosts || []))
  const incomingGhosts: Ghost[] = vehiclesNeedingVirtualGhosts.map((vehicle) =>
    ghostFromVehicleScheduledLocation(vehicle)
  )

  return {
    ...realVehicles,
    onRoute: [...realVehicles.onRoute, ...incomingGhosts],
  }
}

const runNotSharedByAnotherVehicle = (vehiclesAndGhosts: VehicleOrGhost[]) => (
  vehicle: Vehicle
): boolean => {
  if (vehicle.runId === null) {
    return false
  }

  const otherVehicles = vehiclesAndGhosts.filter(({ id }) => id !== vehicle.id)
  const otherRunIds = runIds(otherVehicles)

  return !otherRunIds.includes(vehicle.runId)
}

const runIds = (vehiclesAndGhosts: VehicleOrGhost[]): RunId[] =>
  vehiclesAndGhosts
    .map(({ runId }) => runId)
    .filter((runId) => runId !== null) as RunId[]

const lateStartingIncomingVehicles = (
  incomingVehiclesOrGhosts: VehicleOrGhost[],
  currentRouteId: RouteId
): Vehicle[] =>
  incomingVehiclesOrGhosts.filter(
    (vehicleOrGhost) =>
      isAVehicleThatIsLateStartingScheduledTrip(vehicleOrGhost) &&
      isScheduledForCurrentRoute(vehicleOrGhost as Vehicle, currentRouteId)
  ) as Vehicle[]

const lateStartingLayingOverVehicles = (
  layingOverVehiclesOrGhosts: VehicleOrGhost[]
): Vehicle[] =>
  layingOverVehiclesOrGhosts.filter(
    (vehicleOrGhost) =>
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
  blockWaivers: vehicle.blockWaivers,
})
