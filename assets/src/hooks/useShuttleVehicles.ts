import { Channel, Socket } from "phoenix"
import { Dispatch, useEffect, useReducer } from "react"
import { VehicleData, vehicleFromData } from "../models/vehicleData"
import { Vehicle } from "../realtime"

interface State {
  shuttles: Vehicle[] | null
  channel?: Channel
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_CHANNEL":
      return { ...state, channel: action.payload.channel }

    case "SET_SHUTTLES":
      return { ...state, shuttles: action.payload.shuttles }
  }
}

const initialState: State = {
  shuttles: null,
}

interface SetShuttlesAction {
  type: "SET_SHUTTLES"
  payload: {
    shuttles: Vehicle[]
  }
}

const setShuttles = (shuttles: Vehicle[]): SetShuttlesAction => ({
  type: "SET_SHUTTLES",
  payload: { shuttles },
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

type Action = SetShuttlesAction | SetChannelAction

interface ChannelPayload {
  data: VehicleData[]
}

const subscribe = (socket: Socket, dispatch: Dispatch<Action>): Channel => {
  const handleShuttles = (payload: ChannelPayload): void => {
    dispatch(
      setShuttles(
        payload.data.map(data => vehicleFromData({ isOnRoute: true })(data))
      )
    )
  }

  const channel = socket.channel("vehicles:shuttle:all")

  channel.on("shuttles", handleShuttles)

  channel
    .join()
    .receive("ok", () => {
      // tslint:disable-next-line: no-console
      console.log("successfully joined shuttle channel")
    })
    // tslint:disable-next-line: no-console
    .receive("error", ({ reason }) => console.error("join failed", reason))
    .receive("timeout", () => {
      window.location.reload(true)
    })

  return channel
}

const useShuttleVehicles = (socket: Socket | undefined): Vehicle[] | null => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { channel, shuttles } = state
  useEffect(() => {
    if (socket && !channel) {
      const newChannel = subscribe(socket, dispatch)
      dispatch(setChannel(newChannel))
    }
  }, [socket])

  return shuttles
}

export default useShuttleVehicles
