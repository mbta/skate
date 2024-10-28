import { Socket } from "phoenix"
import { array } from "superstruct"
import { VehicleData, vehicleFromData } from "../models/vehicleData"
import { Vehicle } from "../realtime"
import { useCheckedChannel } from "./useChannel"

const parser = (data: VehicleData[]): Vehicle[] => data.map(vehicleFromData)

const dataStruct = array(VehicleData)

const useShuttleVehicles = (socket: Socket | undefined): Vehicle[] | null => {
  return useCheckedChannel<VehicleData[], Vehicle[] | null>({
    socket,
    topic: "vehicles:shuttle:all",
    event: "shuttles",
    dataStruct,
    parser,
    loadingState: null,
  })
}

export default useShuttleVehicles
