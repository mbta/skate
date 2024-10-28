import { Socket } from "phoenix"
import { useRef } from "react"
import { Ghost, Vehicle } from "../realtime"
import useVehicleForId from "./useVehicleForId"

// While a new vehicle is loading, returns data for the most recently loaded vehicle
const useMostRecentVehicleById = (
  socket: Socket | undefined,
  vehicleId: string | null
) => {
  const mostRecentVehicle = useRef<Vehicle | Ghost | null>(null)

  const selectedVehicleOrGhost =
    useVehicleForId(socket, vehicleId ?? null) || null

  if (vehicleId == null) {
    mostRecentVehicle.current = null
    // `vehicleId` should change 'atomically', therefore, if it's `null`,
    // there should be no result or api response, and should return `null`
    return null
  }

  if (selectedVehicleOrGhost != null) {
    // only set the newly selected vehicle as the most recent once it has loaded/is no longer null
    mostRecentVehicle.current = selectedVehicleOrGhost
  }

  return mostRecentVehicle.current
}

export default useMostRecentVehicleById
