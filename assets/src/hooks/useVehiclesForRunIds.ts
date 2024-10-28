import { Socket } from "phoenix"
import { nullableParser } from "../api"
import {
  vehicleInScheduledServiceOrGhostFromData,
  VehicleInScheduledServiceData,
  GhostData,
} from "../models/vehicleData"
import { VehicleInScheduledService, Ghost } from "../realtime"
import { RunId } from "../realtime"
import { useChannel } from "./useChannel"

const parser = (
  data: (VehicleInScheduledServiceData | GhostData)[]
): (VehicleInScheduledService | Ghost)[] =>
  data.map(vehicleInScheduledServiceOrGhostFromData)
const parserWithNull = nullableParser(parser)

const useVehiclesForRunIds = (
  socket: Socket | undefined,
  runIds: RunId[],
  closeAfterFirstRead?: boolean
): (VehicleInScheduledService | Ghost)[] | null | undefined => {
  const topic: string | null =
    runIds.length > 0 ? `vehicles:run_ids:${runIds.join(",")}` : null

  return useChannel<(VehicleInScheduledService | Ghost)[] | null | undefined>({
    socket,
    topic,
    event: "vehicles",
    parser: parserWithNull,
    loadingState: undefined,
    closeAfterFirstRead,
  })
}

export default useVehiclesForRunIds
