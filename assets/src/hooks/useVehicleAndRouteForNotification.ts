import { Socket } from "phoenix"
import { useContext, useEffect } from "react"
import { parseRouteData, RouteData } from "../api"
import { SocketContext } from "../contexts/socketContext"
import { useChannel } from "../hooks/useChannel"
import { isVehicle } from "../models/vehicle"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhostAndRoute } from "../realtime.d"
import { TripId } from "../schedule.d"

const parseVehicleOrGhostAndRouteData = ({
  vehicleOrGhostData,
  routeData,
}: {
  vehicleOrGhostData?: VehicleOrGhostData
  routeData?: RouteData
}): VehicleOrGhostAndRoute | undefined => {
  if (vehicleOrGhostData === undefined || routeData === undefined) {
    return undefined
  }

  const vehicleOrGhost = vehicleOrGhostFromData(vehicleOrGhostData)

  if (vehicleOrGhost) {
    return {
      vehicleOrGhost,
      route: parseRouteData(routeData),
    }
  }

  return undefined
}

const useVehicleAndRouteForNotification = (
  selectedTripIdsForNotification?: TripId[]
): VehicleOrGhostAndRoute | undefined => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const topic: string | null = selectedTripIdsForNotification
    ? `vehicle:trip_ids:${selectedTripIdsForNotification.join(",")}`
    : null

  const newVehicleOrGhostAndRoute = useChannel<
    VehicleOrGhostAndRoute | undefined
  >({
    socket,
    topic,
    event: "vehicle",
    parser: parseVehicleOrGhostAndRouteData,
    loadingState: undefined,
  })

  useEffect(() => {
    /* istanbul ignore next */
    if (window.FS) {
      if (newVehicleOrGhostAndRoute) {
        if (isVehicle(newVehicleOrGhostAndRoute.vehicleOrGhost)) {
          window.FS.event("Notification linked to VPP")
        } else {
          window.FS.event("Notification linked to ghost")
        }
      } else if (selectedTripIdsForNotification) {
        window.FS.event("Notification link failed")
      }
    }
  }, [newVehicleOrGhostAndRoute])

  return newVehicleOrGhostAndRoute
}

export default useVehicleAndRouteForNotification
