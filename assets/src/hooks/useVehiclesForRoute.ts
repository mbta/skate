import { Socket } from "phoenix"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { RouteId } from "../schedule"
import { useChannel } from "./useChannel"

const parser = (data: VehicleOrGhostData[]): VehicleOrGhost[] =>
  data.map(vehicleOrGhostFromData)

const useVehiclesForRoute = (
  socket: Socket | undefined,
  routeId: RouteId | null
): VehicleOrGhost[] | null => {
  const topic: string | null = routeId && `vehicles:route:${routeId}`
  return useChannel<VehicleOrGhost[] | null>({
    socket,
    topic,
    event: "vehicles",
    parser,
    loadingState: null,
  })
}

export default useVehiclesForRoute
