import { Channel, Socket } from "phoenix"
import { Dispatch as ReactDispatch, useEffect, useReducer } from "react"
import { ByRouteId, RouteId, Vehicle, VehiclesByRouteId } from "../skate.d"

interface State {
  channelsByRouteId: ByRouteId<Channel>
  vehiclesByRouteId: VehiclesByRouteId
}

const initialState: State = {
  channelsByRouteId: {},
  vehiclesByRouteId: {},
}

interface SetChannelForRouteAction {
  type: "SET_CHANNEL"
  payload: {
    routeId: RouteId
    channel: Channel
  }
}

const setChannelForRoute = (
  routeId: RouteId,
  channel: Channel
): SetChannelForRouteAction => ({
  type: "SET_CHANNEL",
  payload: { routeId, channel },
})

interface SetVehiclesForRouteAction {
  type: "SET_VEHICLES_FOR_ROUTE"
  payload: { routeId: RouteId; vehicles: Vehicle[] }
}

const setVehiclesForRoute = (
  routeId: RouteId,
  vehicles: Vehicle[]
): SetVehiclesForRouteAction => ({
  type: "SET_VEHICLES_FOR_ROUTE",
  payload: { routeId, vehicles },
})

interface RemoveRouteAction {
  type: "REMOVE_ROUTE"
  payload: {
    routeId: RouteId
  }
}

const removeRoute = (routeId: RouteId): RemoveRouteAction => ({
  type: "REMOVE_ROUTE",
  payload: { routeId },
})

type Action =
  | SetChannelForRouteAction
  | SetVehiclesForRouteAction
  | RemoveRouteAction

type Dispatch = ReactDispatch<Action>

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_CHANNEL":
      return {
        ...state,
        channelsByRouteId: {
          ...state.channelsByRouteId,
          [action.payload.routeId]: action.payload.channel,
        },
      }
    case "SET_VEHICLES_FOR_ROUTE":
      return {
        ...state,
        vehiclesByRouteId: {
          ...state.vehiclesByRouteId,
          [action.payload.routeId]: action.payload.vehicles,
        },
      }
    case "REMOVE_ROUTE":
      const {
        [action.payload.routeId]: _channel,
        ...channelsWithoutRouteId
      } = state.channelsByRouteId
      const {
        [action.payload.routeId]: _vehicles,
        ...vehiclesWithoutRouteId
      } = state.vehiclesByRouteId
      return {
        ...state,
        channelsByRouteId: channelsWithoutRouteId,
        vehiclesByRouteId: vehiclesWithoutRouteId,
      }
    default:
      return state
  }
}

const subscribe = (
  socket: Socket,
  routeId: RouteId,
  dispatch: Dispatch
): Channel => {
  const handleVehicles = ({ vehicles }: { vehicles: Vehicle[] }) => {
    dispatch(setVehiclesForRoute(routeId, vehicles))
  }

  const topic = `vehicles:${routeId}`
  const channel = socket.channel(topic)
  channel.on("vehicles", handleVehicles)
  channel
    .join()
    .receive("ok", handleVehicles)
    // tslint:disable-next-line: no-console
    .receive("error", ({ reason }) => console.error("join failed", reason))
    // tslint:disable-next-line: no-console
    .receive("timeout", () => console.error("join timeout"))
  return channel
}

const useVehicles = (
  socket: Socket | undefined,
  selectedRouteIds: RouteId[]
): VehiclesByRouteId => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { channelsByRouteId, vehiclesByRouteId } = state

  useEffect(() => {
    if (socket) {
      // Unsubscribe from any routes we don't care about anymore
      Object.entries(channelsByRouteId).forEach(([routeId, channel]) => {
        if (!selectedRouteIds.includes(routeId)) {
          channel.leave()
          dispatch(removeRoute(routeId))
        }
      })

      // Subscribe to any routes we're not already subscribed to
      selectedRouteIds.forEach((routeId: RouteId) => {
        if (!(routeId in channelsByRouteId)) {
          const channel = subscribe(socket, routeId, dispatch)
          dispatch(setChannelForRoute(routeId, channel))
        }
      })
    }
  }, [socket, selectedRouteIds])

  return vehiclesByRouteId
}

export default useVehicles
