import { Socket } from "phoenix"
import { VehicleData, vehicleFromData } from "../models/vehicleData"
import { Vehicle } from "../realtime"
import { useChannel } from "./useChannel"

const parser = (data: VehicleData[]): Vehicle[] => data.map(vehicleFromData)

const useShuttleVehicles = (socket: Socket | undefined): Vehicle[] | null => {
  return useChannel<Vehicle[] | null>({
    socket,
    topic: "vehicles:shuttle:all",
    event: "shuttles",
    parser,
    loadingState: null,
  })
}

export default useShuttleVehicles
