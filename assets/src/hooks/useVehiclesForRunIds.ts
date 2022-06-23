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
const parserWithNull = nullableParser(parser)

const useVehiclesForRunIds = (
  socket: Socket | undefined,
  runIds: RunId[],
  closeAfterFirstRead?: boolean
): VehicleOrGhost[] | null | undefined => {
  const topic: string | null =
    runIds.length > 0 ? `vehicles:run_ids:${runIds.join(",")}` : null

  return useChannel<VehicleOrGhost[] | null | undefined>({
    socket,
    topic,
    event: "vehicles",
    parser: parserWithNull,
    loadingState: undefined,
    closeAfterFirstRead,
  })
}

export default useVehiclesForRunIds
