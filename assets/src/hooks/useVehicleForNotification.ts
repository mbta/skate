import { Socket } from "phoenix"
import useVehiclesForRunIds from "./useVehiclesForRunIds"
import { Notification, VehicleOrGhost } from "../realtime.d"
import { useEffect, useState } from "react"
import { tagManagerEvent } from "../helpers/googleTagManager"

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

  const [clickthroughLogged, setClickthroughLogged] = useState<boolean>(false)

  useEffect(() => {
    if (!clickthroughLogged) {
      if (newVehicleOrGhost) {
        setClickthroughLogged(true)
        tagManagerEvent("notification_linked_to_vpp")
      } else if (notification && newVehicleOrGhost === null) {
        setClickthroughLogged(true)
        tagManagerEvent("notification_linked_to_inactive_modal")
      }
    }
  }, [clickthroughLogged, notification, newVehicleOrGhost])

  return newVehicleOrGhost
}

export default useVehicleForNotification
