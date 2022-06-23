import { Socket } from "phoenix"
import useVehiclesForRunIds from "./useVehiclesForRunIds"
import { Notification, VehicleOrGhost } from "../realtime.d"

const useVehicleForNotification = (
  notification?: Notification,
  socket?: Socket
): VehicleOrGhost | undefined | null => {
  // undefined means we're still trying to load the vehicle,
  // null means we tried and failed
  const runIds = notification?.runIds || []

  const newVehiclesOrGhosts = useVehiclesForRunIds(socket, runIds, true)
  const newVehicleOrGhost = Array.isArray(newVehiclesOrGhosts)
    ? newVehiclesOrGhosts[0] || null
    : newVehiclesOrGhosts

  return newVehicleOrGhost
}

export default useVehicleForNotification
