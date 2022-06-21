import { Channel, Socket } from "phoenix"
import { Dispatch as ReactDispatch, useEffect, useReducer } from "react"
import { reload } from "../models/browser"
import {
  VehicleOrGhostData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { VehicleOrGhost } from "../realtime.d"
import { ByRouteId, RouteId } from "../schedule.d"

interface State {
  channelsByRouteId: ByRouteId<Channel>
  vehiclesByRouteId: ByRouteId<VehicleOrGhost[]>
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
  payload: {
    routeId: RouteId
    vehiclesForRoute: VehicleOrGhost[]
  }
}

const setVehiclesForRoute = (
  routeId: RouteId,
  vehiclesForRoute: VehicleOrGhost[]
): SetVehiclesForRouteAction => ({
  type: "SET_VEHICLES_FOR_ROUTE",
  payload: {
    routeId,
    vehiclesForRoute,
  },
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
          [action.payload.routeId]: action.payload.vehiclesForRoute,
        },
      }
    case "REMOVE_ROUTE": {
      const { [action.payload.routeId]: _channel, ...channelsWithoutRouteId } =
        state.channelsByRouteId
      const {
        [action.payload.routeId]: _vehiclesForRoute,
        ...vehiclesByRouteIdWithoutRouteId
      } = state.vehiclesByRouteId
      return {
        ...state,
        channelsByRouteId: channelsWithoutRouteId,
        vehiclesByRouteId: vehiclesByRouteIdWithoutRouteId,
      }
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
  const handleVehicles = ({
    data: vehiclesAndGhostsData,
  }: {
    data: VehicleOrGhostData[]
  }) => {
    const vehiclesAndGhosts = vehiclesAndGhostsData.map(vehicleOrGhostFromData)
    dispatch(setVehiclesForRoute(routeId, vehiclesAndGhosts))
  }

  const topic = `vehicles:route:${routeId}`
  const channel = socket.channel(topic)

  channel.on("vehicles", handleVehicles)

  // Reload our session if the auth has expired
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", handleVehicles)
    // eslint-disable-next-line no-console
    .receive("error", ({ reason }) => console.error("join failed", reason))
    .receive("timeout", reload)
  return channel
}

const useVehicles = (
  socket: Socket | undefined,
  selectedRouteIds: RouteId[]
): ByRouteId<VehicleOrGhost[]> => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { channelsByRouteId, vehiclesByRouteId } = state

  /* eslint-disable react-hooks/exhaustive-deps */
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
  /* eslint-enable react-hooks/exhaustive-deps */

  return vehiclesByRouteId
}

export default useVehicles
