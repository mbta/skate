import { Channel, Socket } from "phoenix"
import { Dispatch as ReactDispatch, useEffect, useReducer } from "react"
import {
  ByRouteId,
  DirectionId,
  RouteId,
  ScheduleAdherenceStatus,
  Vehicle,
  VehicleRouteStatus,
  VehiclesByRouteId,
  VehicleStatus,
  VehicleStopStatus,
  VehicleTimepointStatus,
} from "../skate.d"

interface DataDiscrepancyData {
  attribute: string
  sources: DataDiscrepancySourceData[]
}

interface DataDiscrepancySourceData {
  id: string
  value: string
}

export interface VehicleStopStatusData {
  status: VehicleStatus
  stop_id: string
  stop_name: string
}

export interface VehicleTimepointStatusData {
  timepoint_id: string
  fraction_until_timepoint: number
}

interface VehicleData {
  id: string
  label: string
  run_id: string
  timestamp: number
  latitude: number
  longitude: number
  direction_id: DirectionId
  route_id: RouteId
  trip_id: string
  headsign: string | null
  via_variant: string | null
  operator_id: string
  operator_name: string
  bearing: number
  speed: number
  block_id: string
  headway_secs: number
  previous_vehicle_id: string
  schedule_adherence_secs: number
  schedule_adherence_string: string
  scheduled_headway_secs: number
  sources: string[]
  data_discrepancies: DataDiscrepancyData[]
  stop_status: VehicleStopStatusData
  timepoint_status: VehicleTimepointStatusData | null
  scheduled_timepoint_status: VehicleTimepointStatusData | null
  route_status: VehicleRouteStatus
}

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

const scheduleAdherenceStatus = (
  scheduleAdherenceSecs: number
): ScheduleAdherenceStatus => {
  const oneMinuteInSeconds = 60
  const sixMinutesInSeconds = 360

  if (scheduleAdherenceSecs < -oneMinuteInSeconds) {
    return "early"
  } else if (scheduleAdherenceSecs > sixMinutesInSeconds) {
    return "late"
  } else {
    return "on-time"
  }
}

const dataDiscrepanciesFromData = (dataDiscrepancies: DataDiscrepancyData[]) =>
  dataDiscrepancies.map(dataDiscrepancy => ({
    attribute: dataDiscrepancy.attribute,
    sources: dataDiscrepancy.sources,
  }))

const vehicleStopStatusFromData = (
  vehicleStopStatusData: VehicleStopStatusData
): VehicleStopStatus => ({
  status: vehicleStopStatusData.status,
  stopId: vehicleStopStatusData.stop_id,
  stopName: vehicleStopStatusData.stop_name,
})

const vehicleTimepointStatusFromData = (
  vehicleTimepointStatusData: VehicleTimepointStatusData | null
): VehicleTimepointStatus | null => {
  if (vehicleTimepointStatusData) {
    return {
      fractionUntilTimepoint:
        vehicleTimepointStatusData.fraction_until_timepoint,
      timepointId: vehicleTimepointStatusData.timepoint_id,
    }
  } else {
    return null
  }
}

const vehicleFromData = (vehicleData: VehicleData): Vehicle => ({
  id: vehicleData.id,
  label: vehicleData.label,
  runId: vehicleData.run_id,
  timestamp: vehicleData.timestamp,
  latitude: vehicleData.latitude,
  longitude: vehicleData.longitude,
  directionId: vehicleData.direction_id,
  routeId: vehicleData.route_id,
  tripId: vehicleData.trip_id,
  headsign: vehicleData.headsign,
  viaVariant: vehicleData.via_variant,
  operatorId: vehicleData.operator_id,
  operatorName: vehicleData.operator_name,
  bearing: vehicleData.bearing,
  speed: vehicleData.speed,
  blockId: vehicleData.block_id,
  headwaySecs: vehicleData.headway_secs,
  previousVehicleId: vehicleData.previous_vehicle_id,
  scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
  scheduleAdherenceString: vehicleData.schedule_adherence_string,
  scheduleAdherenceStatus: scheduleAdherenceStatus(
    vehicleData.schedule_adherence_secs
  ),
  scheduledHeadwaySecs: vehicleData.scheduled_headway_secs,
  dataDiscrepancies: dataDiscrepanciesFromData(vehicleData.data_discrepancies),
  stopStatus: vehicleStopStatusFromData(vehicleData.stop_status),
  timepointStatus: vehicleTimepointStatusFromData(vehicleData.timepoint_status),
  scheduledTimepointStatus: vehicleTimepointStatusFromData(
    vehicleData.scheduled_timepoint_status
  ),
  routeStatus: vehicleData.route_status,
})

const subscribe = (
  socket: Socket,
  routeId: RouteId,
  dispatch: Dispatch
): Channel => {
  const handleVehicles = ({
    vehicles: vehiclesData,
  }: {
    vehicles: VehicleData[]
  }) => {
    const vehicles = vehiclesData.map(vehicleData =>
      vehicleFromData(vehicleData)
    )
    dispatch(setVehiclesForRoute(routeId, vehicles))
  }

  const topic = `vehicles:${routeId}`
  const channel = socket.channel(topic)

  channel.on("vehicles", handleVehicles)

  // Reload our session if the auth has expired
  channel.on("auth_expired", () => {
    window.location.reload(true)
  })

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
