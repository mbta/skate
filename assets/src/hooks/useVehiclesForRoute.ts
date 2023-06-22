import { Socket } from "phoenix"
import { array } from "superstruct"
import {
  vehicleInScheduledServiceOrGhostFromData,
  VehicleOrGhostData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { RouteId } from "../schedule"
import { useCheckedChannel } from "./useChannel"

const parser = (data: VehicleOrGhostData[]): VehicleOrGhost[] =>
  data.map(vehicleInScheduledServiceOrGhostFromData)

const dataStruct = array(VehicleOrGhostData)

const useVehiclesForRoute = (
  socket: Socket | undefined,
  routeId: RouteId | null
): VehicleOrGhost[] | null => {
  const topic: string | null = routeId && `vehicles:route:${routeId}`
  return useCheckedChannel<VehicleOrGhostData[], VehicleOrGhost[] | null>({
    socket,
    topic,
    event: "vehicles",
    dataStruct,
    parser,
    loadingState: null,
  })
}

export default useVehiclesForRoute
