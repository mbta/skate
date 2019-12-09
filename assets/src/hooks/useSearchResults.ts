import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"
import { SearchQuery } from "../models/searchQuery"

interface SearchResultsPayload {
  data: VehicleOrGhostData[]
}

const subscribe = (
  socket: Socket,
  searchQuery: SearchQuery,
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
    `vehicles:search:${searchQuery.property}:${searchQuery.text}`
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
  searchQuery: SearchQuery | null
): VehicleOrGhost[] | null | undefined => {
  const [vehicles, setVehicles] = useState<VehicleOrGhost[] | null | undefined>(
    undefined
  )

  useEffect(() => {
    let channel: Channel | undefined

    const leaveChannel = () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }

    if (searchQuery === null) {
      leaveChannel()
      setVehicles(undefined)
    }

    if (socket && searchQuery !== null) {
      setVehicles(null)
      channel = subscribe(socket, searchQuery, setVehicles)
    }

    return leaveChannel
  }, [socket, searchQuery])

  return vehicles
}

export default useSearchResults
