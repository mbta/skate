import { Socket } from "phoenix"
import { array, union } from "superstruct"
import {
  vehicleInScheduledServiceOrGhostFromData,
  VehicleInScheduledServiceData,
  GhostData,
} from "../models/vehicleData"
import { VehicleInScheduledService, Ghost } from "../realtime"
import { RouteId } from "../schedule"
import { useCheckedChannel } from "./useChannel"

const parser = (
  data: (VehicleInScheduledServiceData | GhostData)[]
): (VehicleInScheduledService | Ghost)[] =>
  data.map(vehicleInScheduledServiceOrGhostFromData)

const dataStruct = array(union([VehicleInScheduledServiceData, GhostData]))

const useVehiclesForRoute = (
  socket: Socket | undefined,
  routeId: RouteId | null
): (VehicleInScheduledService | Ghost)[] | null => {
  const topic: string | null = routeId && `vehicles:route:${routeId}`
  return useCheckedChannel<
    (VehicleInScheduledServiceData | GhostData)[],
    (VehicleInScheduledService | Ghost)[] | null
  >({
    socket,
    topic,
    event: "vehicles",
    dataStruct,
    parser,
    loadingState: null,
  })
}

export default useVehiclesForRoute
