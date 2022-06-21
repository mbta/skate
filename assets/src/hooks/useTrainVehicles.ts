import { Channel, Socket } from "phoenix"
import { Dispatch as ReactDispatch, useEffect, useReducer } from "react"
import { reload } from "../models/browser"
import { TrainVehicle } from "../realtime"
import { ByRouteId, RouteId } from "../schedule"

interface State {
  channelsByRouteId: ByRouteId<Channel>
  trainVehiclesByRouteId: ByRouteId<TrainVehicle[]>
}

const initialState: State = {
  channelsByRouteId: {},
  trainVehiclesByRouteId: {},
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

interface SetTrainVehiclesForRouteAction {
  type: "SET_TRAIN_VEHICLES_FOR_ROUTE"
  payload: {
    routeId: RouteId
    trainVehiclesForRoute: TrainVehicle[]
  }
}

const setTrainVehiclesForRoute = (
  routeId: RouteId,
  trainVehiclesForRoute: TrainVehicle[]
): SetTrainVehiclesForRouteAction => ({
  type: "SET_TRAIN_VEHICLES_FOR_ROUTE",
  payload: {
    routeId,
    trainVehiclesForRoute,
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
  | SetTrainVehiclesForRouteAction
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
    case "SET_TRAIN_VEHICLES_FOR_ROUTE":
      return {
        ...state,
        trainVehiclesByRouteId: {
          ...state.trainVehiclesByRouteId,
          [action.payload.routeId]: action.payload.trainVehiclesForRoute,
        },
      }
    case "REMOVE_ROUTE": {
      const { [action.payload.routeId]: _channel, ...channelsWithoutRouteId } =
        state.channelsByRouteId
      const {
        [action.payload.routeId]: _trainVehiclesForRoute,
        ...trainVehiclesByRouteIdWithoutRouteId
      } = state.trainVehiclesByRouteId
      return {
        ...state,
        channelsByRouteId: channelsWithoutRouteId,
        trainVehiclesByRouteId: trainVehiclesByRouteIdWithoutRouteId,
      }
    }
    default:
      return state
  }
}

export interface TrainVehicleData {
  id: string
  latitude: number
  longitude: number
  bearing: number
}

const trainVehicleFromData = (
  trainVehicleData: TrainVehicleData
): TrainVehicle => ({
  id: trainVehicleData.id,
  latitude: trainVehicleData.latitude,
  longitude: trainVehicleData.longitude,
  bearing: trainVehicleData.bearing,
})

const subscribe = (
  socket: Socket,
  routeId: RouteId,
  dispatch: Dispatch
): Channel => {
  const handleTrainVehicles = ({
    data: trainVehiclesData,
  }: {
    data: TrainVehicleData[]
  }) => {
    const trainVehicles = trainVehiclesData.map(trainVehicleFromData)
    dispatch(setTrainVehiclesForRoute(routeId, trainVehicles))
  }

  const topic = `train_vehicles:${routeId}`
  const channel = socket.channel(topic)

  channel.on("train_vehicles", handleTrainVehicles)

  // Reload our session if the auth has expired
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", handleTrainVehicles)
    .receive("error", ({ reason }) =>
      // eslint-disable-next-line no-console
      console.error("Train vehicles join failed", reason)
    )
    .receive("timeout", reload)
  return channel
}

const useTrainVehicles = (
  socket: Socket | undefined,
  selectedTrainRouteIds: RouteId[]
): ByRouteId<TrainVehicle[]> => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { channelsByRouteId, trainVehiclesByRouteId } = state

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (socket) {
      // Unsubscribe from any routes we don't care about anymore
      Object.entries(channelsByRouteId).forEach(([routeId, channel]) => {
        if (!selectedTrainRouteIds.includes(routeId)) {
          channel.leave()
          dispatch(removeRoute(routeId))
        }
      })

      // Subscribe to any routes we're not already subscribed to
      selectedTrainRouteIds.forEach((routeId: RouteId) => {
        if (!(routeId in channelsByRouteId)) {
          const channel = subscribe(socket, routeId, dispatch)
          dispatch(setChannelForRoute(routeId, channel))
        }
      })
    }
  }, [socket, selectedTrainRouteIds])
  /* eslint-enable react-hooks/exhaustive-deps */

  return trainVehiclesByRouteId
}

export default useTrainVehicles
