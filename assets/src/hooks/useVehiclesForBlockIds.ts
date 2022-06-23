import { Socket } from "phoenix"
import { nullableParser } from "../api"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { BlockId } from "../schedule"
import { useChannel } from "./useChannel"

const parser = (data: VehicleOrGhostData[]): VehicleOrGhost[] =>
  data.map(vehicleOrGhostFromData)
const parserWithNull = nullableParser(parser)

const useVehiclesForBlockIds = (
  socket: Socket | undefined,
  blockIds: BlockId[]
): VehicleOrGhost[] | null | undefined => {
  const topic: string | null =
    blockIds.length > 0 ? `vehicles:block_ids:${blockIds.join(",")}` : null

  return useChannel<VehicleOrGhost[] | null | undefined>({
    socket,
    topic,
    event: "vehicles",
    parser: parserWithNull,
    loadingState: undefined,
  })
}

export default useVehiclesForBlockIds
