import { useEffect, useState } from "react"
import { fetchCurrentVehicleForTrips } from "../api"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhostAndRoute } from "../realtime.d"
import { TripId } from "../schedule.d"

const useVehicleAndRouteForNotification = (
  selectedTripIdsForNotification?: TripId[]
) => {
  const [vehicleOrGhostAndRoute, setVehicleOrGhostAndRoute] = useState<
    VehicleOrGhostAndRoute | undefined
  >()

  useEffect(() => {
    if (selectedTripIdsForNotification === undefined) {
      setVehicleOrGhostAndRoute(undefined)
      return
    }

    fetchCurrentVehicleForTrips(selectedTripIdsForNotification).then(
      (newVehicleOrGhostAndRoute: VehicleOrGhostAndRoute | null) => {
        if (window.FS) {
          if (newVehicleOrGhostAndRoute) {
            if (isVehicle(newVehicleOrGhostAndRoute.vehicleOrGhost)) {
              window.FS.event("Notification linked to VPP")
            } else {
              window.FS.event("Notification linked to ghost")
            }
          } else {
            window.FS.event("Notification link failed")
          }
        }

        if (newVehicleOrGhostAndRoute) {
          setVehicleOrGhostAndRoute(newVehicleOrGhostAndRoute)
        } else {
          setVehicleOrGhostAndRoute(undefined)
        }
      }
    )
  }, [selectedTripIdsForNotification])

  return vehicleOrGhostAndRoute
}

export default useVehicleAndRouteForNotification
