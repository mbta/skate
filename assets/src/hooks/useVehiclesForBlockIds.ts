import { Socket } from "phoenix"
import { nullableParser } from "../api"
import {
  vehicleInScheduledServiceOrGhostFromData,
  VehicleInScheduledServiceData,
  GhostData,
} from "../models/vehicleData"
import { Ghost, VehicleInScheduledService } from "../realtime"
import { BlockId } from "../schedule"
import { useChannel } from "./useChannel"

const parser = (
  data: (VehicleInScheduledServiceData | GhostData)[]
): (VehicleInScheduledService | Ghost)[] =>
  data.map(vehicleInScheduledServiceOrGhostFromData)
const parserWithNull = nullableParser(parser)

const useVehiclesForBlockIds = (
  socket: Socket | undefined,
  blockIds: BlockId[]
): (VehicleInScheduledService | Ghost)[] | null | undefined => {
  const topic: string | null =
    blockIds.length > 0 ? `vehicles:block_ids:${blockIds.join(",")}` : null

  return useChannel<(VehicleInScheduledService | Ghost)[] | null | undefined>({
    socket,
    topic,
    event: "vehicles",
    parser: parserWithNull,
    loadingState: undefined,
  })
}

export default useVehiclesForBlockIds
