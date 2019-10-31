import { Channel, Socket } from "phoenix"
import { Dispatch, useEffect, useReducer } from "react"
import { isValidSearch, Search } from "../models/search"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime"

interface State {
  vehicles: VehicleOrGhost[] | null
  channel?: Channel
}

const initialState: State = {
  vehicles: null,
}

interface SetVehiclesAction {
  type: "SET_VEHICLES"
  payload: {
    vehicles: VehicleOrGhost[]
  }
}

const setVehicles = (vehicles: VehicleOrGhost[]): SetVehiclesAction => ({
  type: "SET_VEHICLES",
  payload: { vehicles },
})

interface SetChannelAction {
  type: "SET_CHANNEL"
  payload: {
    channel: Channel
  }
}

const setChannel = (channel: Channel): SetChannelAction => ({
  type: "SET_CHANNEL",
  payload: { channel },
})

type Action = SetVehiclesAction | SetChannelAction

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_CHANNEL":
      return { ...state, channel: action.payload.channel }

    case "SET_VEHICLES":
      return { ...state, vehicles: action.payload.vehicles }
  }
}

interface SearchResultsPayload {
  data: VehicleOrGhostData[]
}

const subscribe = (
  socket: Socket,
  search: Search,
  dispatch: Dispatch<Action>
): Channel => {
  const handleSearchResults = (payload: SearchResultsPayload): void => {
    dispatch(
      setVehicles(payload.data.map(data => vehicleOrGhostFromData(data)))
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
  const [{ channel, vehicles }, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (socket && isValidSearch(search)) {
      const newChannel = subscribe(socket, search, dispatch)
      dispatch(setChannel(newChannel))
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
