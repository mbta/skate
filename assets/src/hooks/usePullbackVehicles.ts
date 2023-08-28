import { Socket } from "phoenix"
import { array } from "superstruct"
import { VehicleData, vehicleFromData } from "../models/vehicleData"
import { Vehicle } from "../realtime"
import { useCheckedChannel } from "./useChannel"

const parser = (data: VehicleData[]): Vehicle[] => data.map(vehicleFromData)

const dataStruct = array(VehicleData)

const usePullbackVehicles = (
  socket: Socket | undefined,
  subscribe: boolean = true
): Vehicle[] | null => {
  return useCheckedChannel<VehicleData[], Vehicle[] | null>({
    socket: subscribe ? socket : undefined,
    topic: "vehicles:pull_backs:all",
    event: "pull_backs",
    dataStruct,
    parser,
    loadingState: null,
  })
}

export default usePullbackVehicles
