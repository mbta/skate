import { Socket } from "phoenix"
import { SearchQuery } from "../models/searchQuery"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { useChannel } from "./useChannel"

const parser = (data: VehicleOrGhostData[]): VehicleOrGhost[] =>
  data.map(vehicleOrGhostFromData)

const useSearchResults = (
  socket: Socket | undefined,
  searchQuery: SearchQuery | null
): VehicleOrGhost[] | null | undefined => {
  const topic: string | null =
    searchQuery && `vehicles:search:${searchQuery.property}:${searchQuery.text}`
  return useChannel<VehicleOrGhost[] | null | undefined>({
    socket,
    topic,
    event: "search",
    parser,
    loadingState: null,
    offState: undefined,
  })
}

export default useSearchResults
