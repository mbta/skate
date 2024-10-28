import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "../models/ladderDirection"
import { isVehicleInScheduledService } from "../models/vehicle"
import { onTimeStatus } from "../models/vehicleStatus"
import { Ghost, RunId, VehicleInScheduledService } from "../realtime"
import { RouteId } from "../schedule.d"

/**
 * Groups vehicles and ghosts by where they should be drawn on the route ladder
 */
export interface VehiclesByPosition {
  onRoute: (VehicleInScheduledService | Ghost)[]
  layingOverTop: (VehicleInScheduledService | Ghost)[]
  layingOverBottom: (VehicleInScheduledService | Ghost)[]
  incoming: (VehicleInScheduledService | Ghost)[]
}

export const emptyVehiclesByPosition: VehiclesByPosition = {
  onRoute: [],
  layingOverTop: [],
  layingOverBottom: [],
  incoming: [],
}

export const groupByPosition = (
  vehiclesAndGhosts: (VehicleInScheduledService | Ghost)[] | undefined,
  routeId: RouteId,
  ladderDirection: LadderDirection
): VehiclesByPosition => {
  const realVehicles = (vehiclesAndGhosts || []).reduce(
    (acc: VehiclesByPosition, current: VehicleInScheduledService | Ghost) => {
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
    emptyVehiclesByPosition
  )

  const vehiclesNeedingVirtualGhosts: VehicleInScheduledService[] =
    lateStartingIncomingVehicles(realVehicles.incoming, routeId).filter(
      runNotSharedByAnotherVehicle(vehiclesAndGhosts || [])
    )

  const incomingGhosts: Ghost[] = vehiclesNeedingVirtualGhosts.map((vehicle) =>
    ghostFromVehicleScheduledLocation(vehicle)
  )

  return {
    ...realVehicles,
    onRoute: [...realVehicles.onRoute, ...incomingGhosts],
  }
}

const runNotSharedByAnotherVehicle =
  (vehiclesAndGhosts: (VehicleInScheduledService | Ghost)[]) =>
  (vehicle: VehicleInScheduledService): boolean => {
    if (vehicle.runId === null) {
      return false
    }

    const otherVehicles = vehiclesAndGhosts.filter(
      ({ id }) => id !== vehicle.id
    )
    const otherRunIds = runIds(otherVehicles)

    return !otherRunIds.includes(vehicle.runId)
  }

const runIds = (
  vehiclesAndGhosts: (VehicleInScheduledService | Ghost)[]
): RunId[] =>
  vehiclesAndGhosts
    .map(({ runId }) => runId)
    .filter((runId) => runId !== null) as RunId[]

const lateStartingIncomingVehicles = (
  incomingVehiclesOrGhosts: (VehicleInScheduledService | Ghost)[],
  currentRouteId: RouteId
): VehicleInScheduledService[] =>
  incomingVehiclesOrGhosts.filter(
    (vehicleOrGhost) =>
      isAVehicleThatIsLateStartingScheduledTrip(vehicleOrGhost) &&
      isScheduledForCurrentRoute(
        vehicleOrGhost as VehicleInScheduledService,
        currentRouteId
      ) &&
      isLessThanOneHourLate(
        vehicleOrGhost as VehicleInScheduledService
      ) /* virtually all trips are less than an hour, so trip should have ended if more than an hour after start time */
  ) as VehicleInScheduledService[]

const isAVehicleThatIsLateStartingScheduledTrip = (
  vehicleOrGhost: VehicleInScheduledService | Ghost
): boolean =>
  isVehicleInScheduledService(vehicleOrGhost) &&
  hasAScheduleLocation(vehicleOrGhost) &&
  isLateStartingScheduledTrip(vehicleOrGhost)

const isScheduledForCurrentRoute = (
  vehicle: VehicleInScheduledService,
  currentRouteId: RouteId
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
): boolean => vehicle.scheduledLocation!.routeId === currentRouteId

const hasAScheduleLocation = (vehicle: VehicleInScheduledService): boolean =>
  vehicle.scheduledLocation != null

const isLateStartingScheduledTrip = (
  vehicle: VehicleInScheduledService
): boolean =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  onTimeStatus(vehicle.scheduledLocation!.timeSinceTripStartTime) === "late"

const isLessThanOneHourLate = (vehicle: VehicleInScheduledService): boolean => {
  const oneHourInSeconds = 3600
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return vehicle.scheduledLocation!.timeSinceTripStartTime < oneHourInSeconds
}

const ghostFromVehicleScheduledLocation = (
  vehicle: VehicleInScheduledService
): Ghost => ({
  id: `ghost-incoming-${vehicle.id}`,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  directionId: vehicle.scheduledLocation!.directionId,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  routeId: vehicle.scheduledLocation!.routeId,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  routePatternId: vehicle.scheduledLocation!.routePatternId,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  tripId: vehicle.scheduledLocation!.tripId,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  headsign: vehicle.scheduledLocation!.headsign || "",
  blockId: vehicle.blockId,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  runId: vehicle.scheduledLocation!.runId,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  viaVariant: vehicle.scheduledLocation!.viaVariant,
  incomingTripDirectionId: vehicle.incomingTripDirectionId,
  layoverDepartureTime: null,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  scheduledTimepointStatus: vehicle.scheduledLocation!.timepointStatus,
  scheduledLogonTime: null,
  routeStatus: "on_route",
  blockWaivers: vehicle.blockWaivers,
  currentPieceStartPlace: null,
  currentPieceFirstRoute: null,
})
