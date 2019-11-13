import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import { Search } from "../models/search"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"

interface SearchResultsPayload {
  data: VehicleOrGhostData[]
}

const subscribe = (
  socket: Socket,
  search: Search,
  setVehicles: (vehicles: VehicleOrGhost[]) => void
): Channel => {
  const handleSearchResults = (payload: SearchResultsPayload): void => {
    setVehicles(
      payload.data.map((data: VehicleOrGhostData) =>
        vehicleOrGhostFromData(data)
      )
    )
  }

  const channel = socket.channel(
    `vehicles:search:${search.property}:${search.text}`
  )
  channel.on("search", handleSearchResults)

  channel
    .join()
    .receive("ok", handleSearchResults)
    .receive("error", ({ reason }) =>
      // tslint:disable-next-line: no-console
      console.error("search channel join failed", reason)
    )
    .receive("timeout", () => {
      window.location.reload(true)
    })

  return channel
}

const useSearchResults = (
  socket: Socket | undefined,
  search: Search
): VehicleOrGhost[] | null => {
  const [vehicles, setVehicles] = useState(null as VehicleOrGhost[] | null)

  useEffect(() => {
    let channel: Channel | undefined
    if (socket && search.isActive) {
      channel = subscribe(socket, search, setVehicles)
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
      }
    }
  }, [socket, search])

  return vehicles
}

export default useSearchResults
