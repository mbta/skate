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
import { Notification, VehicleOrGhostAndRoute } from "../realtime.d"

export interface VehicleOrGhostAndRouteData {
  vehicleOrGhostData?: VehicleOrGhostData
  routeData?: RouteData
}

const parseVehicleOrGhostAndRouteData = ({
  vehicleOrGhostData,
  routeData,
}: VehicleOrGhostAndRouteData): VehicleOrGhostAndRoute | null => {
  if (vehicleOrGhostData === undefined || routeData === undefined) {
    return null
  }

  const vehicleOrGhost = vehicleOrGhostFromData(vehicleOrGhostData)

  return {
    vehicleOrGhost,
    route: parseRouteData(routeData),
  }
}

const useVehicleAndRouteForNotification = (
  notification?: Notification
): VehicleOrGhostAndRoute | undefined | null => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)

  const topic: string | null = notification
    ? `vehicle:trip_ids:${notification.tripIds.join(",")}`
    : null

  // undefined means we're still trying to load the vehicle,
  // null means we tried and failed
  const newVehicleOrGhostAndRoute = useChannel<
    VehicleOrGhostAndRoute | undefined | null
  >({
    socket,
    topic,
    event: "vehicle",
    parser: parseVehicleOrGhostAndRouteData,
    loadingState: undefined,
  })

  const [clickthroughLogged, setClickthroughLogged] = useState<boolean>(false)

  useEffect(() => {
    if (window.FS) {
      if (!clickthroughLogged) {
        if (newVehicleOrGhostAndRoute) {
          setClickthroughLogged(true)
          if (isVehicle(newVehicleOrGhostAndRoute.vehicleOrGhost)) {
            window.FS.event("Notification linked to VPP")
          } else {
            window.FS.event("Notification linked to ghost")
          }
        } else if (notification && newVehicleOrGhostAndRoute === null) {
          setClickthroughLogged(true)
          window.FS.event("Notification link failed")
        }
      }
    }
  }, [newVehicleOrGhostAndRoute, notification])

  return newVehicleOrGhostAndRoute
}

export default useVehicleAndRouteForNotification
