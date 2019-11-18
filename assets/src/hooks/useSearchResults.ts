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
): VehicleOrGhost[] | null | undefined => {
  const [vehicles, setVehicles] = useState<VehicleOrGhost[] | null | undefined>(
    undefined
  )
  const [channel, setChannel] = useState<Channel | undefined>(undefined)

  const leaveChannel = () => {
    if (channel !== undefined) {
      channel.leave()
      setChannel(undefined)
    }
  }

  useEffect(() => {
    if (!search.isActive) {
      leaveChannel()
      setVehicles(undefined)
    }

    if (socket && search.isActive) {
      setVehicles(null)
      setChannel(subscribe(socket, search, setVehicles))
    }

    return leaveChannel
  }, [socket, search])

  return vehicles
}

export default useSearchResults
