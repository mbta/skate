import { Socket } from "phoenix"
import { array } from "superstruct"
import {
  VehicleData,
  vehicleInScheduledServiceFromData,
} from "../models/vehicleData"
import { VehicleInScheduledService } from "../realtime"
import { useCheckedChannel } from "./useChannel"

const parser = (data: VehicleData[]): VehicleInScheduledService[] =>
  data.map(vehicleInScheduledServiceFromData)

const dataStruct = array(VehicleData)

const useShuttleVehicles = (
  socket: Socket | undefined
): VehicleInScheduledService[] | null => {
  return useCheckedChannel<VehicleData[], VehicleInScheduledService[] | null>({
    socket,
    topic: "vehicles:shuttle:all",
    event: "shuttles",
    dataStruct,
    parser,
    loadingState: null,
  })
}

export default useShuttleVehicles
