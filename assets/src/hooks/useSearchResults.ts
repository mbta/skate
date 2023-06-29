import { Socket } from "phoenix"
import { array, union } from "superstruct"
import { SearchQuery } from "../models/searchQuery"
import {
  GhostData,
  VehicleData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { Ghost, Vehicle } from "../realtime"
import { useCheckedChannel } from "./useChannel"

const parser = (data: (VehicleData | GhostData)[]): (Vehicle | Ghost)[] =>
  data.map(vehicleOrGhostFromData)

const dataStruct = array(union([VehicleData, GhostData]))

const useSearchResults = (
  socket: Socket | undefined,
  searchQuery: SearchQuery | null
): (Vehicle | Ghost)[] | null => {
  const topic: string | null =
    searchQuery && `vehicles:search:${searchQuery.property}:${searchQuery.text}`
  return useCheckedChannel<
    (VehicleData | GhostData)[],
    (Vehicle | Ghost)[] | null
  >({
    socket,
    topic,
    event: "search",
    dataStruct,
    parser,
    loadingState: null,
  })
}

export default useSearchResults
