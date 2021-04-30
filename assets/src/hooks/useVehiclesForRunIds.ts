import { Socket } from "phoenix"
import { nullableParser } from "../api"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { RunId } from "../realtime"
import { useChannel } from "./useChannel"

const parser = (data: VehicleOrGhostData[]): VehicleOrGhost[] =>
  data.map(vehicleOrGhostFromData)

const useVehiclesForRunIds = (
  socket: Socket | undefined,
  runIds: RunId[]
): VehicleOrGhost[] | null | undefined => {
  const topic: string | null =
    runIds.length > 0 ? `vehicles:run_ids:${runIds.join(",")}` : null

  return useChannel<VehicleOrGhost[] | null | undefined>({
    socket,
    topic,
    event: "vehicles",
    parser: nullableParser(parser),
    loadingState: undefined,
  })
}

export default useVehiclesForRunIds
