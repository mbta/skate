import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import useVehiclesForRunIds from "./useVehiclesForRunIds"
import { isVehicle } from "../models/vehicle"
import { Notification, VehicleOrGhost } from "../realtime.d"

const useVehicleForNotification = (
  notification?: Notification,
  socket?: Socket
): VehicleOrGhost | undefined | null => {
  // undefined means we're still trying to load the vehicle,
  // null means we tried and failed
  const newVehiclesOrGhosts = useVehiclesForRunIds(
    socket,
    notification?.runIds || []
  )
  const newVehicleOrGhost = Array.isArray(newVehiclesOrGhosts)
    ? newVehiclesOrGhosts[0]
    : newVehiclesOrGhosts

  const [clickthroughLogged, setClickthroughLogged] = useState<boolean>(false)

  useEffect(() => {
    if (window.FS) {
      if (!clickthroughLogged) {
        if (newVehicleOrGhost) {
          setClickthroughLogged(true)
          if (isVehicle(newVehicleOrGhost)) {
            window.FS.event("Notification linked to VPP")
          } else {
            window.FS.event("Notification linked to ghost")
          }
        } else if (notification && newVehicleOrGhost === null) {
          setClickthroughLogged(true)
          window.FS.event(
            new Date() < notification.startTime
              ? "Notification link failed upcoming"
              : "Notification link failed"
          )
        }
      }
    }
  }, [newVehicleOrGhost, notification])

  return newVehicleOrGhost
}

export default useVehicleForNotification
