import { Socket } from "phoenix"
import { useContext, useEffect, useState } from "react"
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

export interface VehicleOrGhostAndRouteData {
  vehicleOrGhostData?: VehicleOrGhostData
  routeData?: RouteData
}

const parseVehicleOrGhostAndRouteData = ({
  vehicleOrGhostData,
  routeData,
}: VehicleOrGhostAndRouteData): VehicleOrGhostAndRoute | undefined => {
  if (vehicleOrGhostData === undefined || routeData === undefined) {
    return undefined
  }

  const vehicleOrGhost = vehicleOrGhostFromData(vehicleOrGhostData)

  return {
    vehicleOrGhost,
    route: parseRouteData(routeData),
  }
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

  const [clickthroughLogged, setClickthroughLogged] = useState<boolean>(false)

  useEffect(() => {
    /* istanbul ignore next */
    if (window.FS) {
      if (!clickthroughLogged) {
        if (newVehicleOrGhostAndRoute) {
          setClickthroughLogged(true)
          if (isVehicle(newVehicleOrGhostAndRoute.vehicleOrGhost)) {
            window.FS.event("Notification linked to VPP")
          } else {
            window.FS.event("Notification linked to ghost")
          }
        } else if (selectedTripIdsForNotification) {
          setClickthroughLogged(true)
          window.FS.event("Notification link failed")
        }
      }
    }
  }, [newVehicleOrGhostAndRoute])

  return newVehicleOrGhostAndRoute
}

export default useVehicleAndRouteForNotification
