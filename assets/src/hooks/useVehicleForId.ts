import { Socket } from "phoenix"
import { nullableParser } from "../api"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { VehicleId } from "../realtime"
import { useChannel } from "./useChannel"

const parser = (data: VehicleOrGhostData): VehicleOrGhost[] => [
  vehicleOrGhostFromData(data),
]
const parserWithNull = nullableParser(parser)

const useVehicleForId = (
  socket: Socket | undefined,
  vehicleId: VehicleId | null
): VehicleOrGhost | null | undefined => {
  const topic = vehicleId ? `vehicle:id:${vehicleId}` : null

  const channelResponse = useChannel<VehicleOrGhost[] | null | undefined>({
    socket,
    topic,
    event: "vehicle",
    parser: parserWithNull,
    loadingState: undefined,
  })

  return channelResponse ? channelResponse[0] : channelResponse
}

export default useVehicleForId
