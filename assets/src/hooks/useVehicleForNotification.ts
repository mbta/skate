import { Socket } from "phoenix"
import { useContext, useEffect, useState } from "react"
import { nullableParser } from "../api"
import { SocketContext } from "../contexts/socketContext"
import { useChannel } from "../hooks/useChannel"
import { isVehicle } from "../models/vehicle"
import { vehicleOrGhostFromData } from "../models/vehicleData"
import { Notification, VehicleOrGhost } from "../realtime.d"

const useVehicleForNotification = (
  notification?: Notification
): VehicleOrGhost | undefined | null => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)

  const topic: string | null = notification
    ? `vehicle:run_ids:${notification.runIds.join(",")}`
    : null

  // undefined means we're still trying to load the vehicle,
  // null means we tried and failed
  const newVehicleOrGhost = useChannel<VehicleOrGhost | undefined | null>({
    socket,
    topic,
    event: "vehicle",
    parser: nullableParser(vehicleOrGhostFromData),
    loadingState: undefined,
  })

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
