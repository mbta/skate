import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import { isValidSearch, Search } from "../models/search"
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

const leaveChannel = (channel: Channel | undefined) => {
  if (channel !== undefined) {
    channel.leave()
  }
}

const useSearchResults = (
  socket: Socket | undefined,
  search: Search
): VehicleOrGhost[] | null => {
  const [vehicles, setVehicles] = useState(null as VehicleOrGhost[] | null)
  const [channel, setChannel] = useState(undefined as Channel | undefined)

  useEffect(() => {
    if (socket && isValidSearch(search)) {
      leaveChannel(channel)
      const newChannel = subscribe(socket, search, setVehicles)
      setChannel(newChannel)
    }

    return () => leaveChannel(channel)
  }, [socket, search])

  return vehicles
}

export default useSearchResults
