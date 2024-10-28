import { Socket } from "phoenix"
import { nullableParser } from "../api"
import {
  GhostData,
  VehicleData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { Ghost, Vehicle } from "../realtime"
import { VehicleId } from "../realtime"
import { useChannel } from "./useChannel"

const parser = (data: VehicleData | GhostData): (Vehicle | Ghost)[] => [
  vehicleOrGhostFromData(data),
]
const parserWithNull = nullableParser(parser)

const useVehicleForId = (
  socket: Socket | undefined,
  vehicleId: VehicleId | null
): Vehicle | Ghost | null | undefined => {
  const topic = vehicleId ? `vehicle:id:${vehicleId}` : null

  const channelResponse = useChannel<(Vehicle | Ghost)[] | null | undefined>({
    socket,
    topic,
    event: "vehicle",
    parser: parserWithNull,
    loadingState: undefined,
  })

  return channelResponse ? channelResponse[0] : channelResponse
}

export default useVehicleForId
