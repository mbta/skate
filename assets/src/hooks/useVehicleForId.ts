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

const useVehicleForId = (
  socket: Socket | undefined,
  vehicleId: VehicleId
): VehicleOrGhost | null | undefined => {
  const topic = `vehicle:id:${vehicleId}`

  const channelResponse = useChannel<VehicleOrGhost[] | null | undefined>({
    socket,
    topic,
    event: "vehicle",
    parser: nullableParser(parser),
    loadingState: undefined,
  })

  return channelResponse ? channelResponse[0] : channelResponse
}

export default useVehicleForId
