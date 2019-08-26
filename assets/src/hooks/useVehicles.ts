import { Channel, Socket } from "phoenix"
import { Dispatch as ReactDispatch, useEffect, useReducer } from "react"
import { HeadwaySpacing } from "../models/vehicleStatus"
import {
  DataDiscrepancy,
  Vehicle,
  VehicleScheduledLocation,
  VehiclesForRoute,
  VehicleStatus,
  VehicleStopStatus,
  VehicleTimepointStatus,
} from "../realtime.d"
import { ByRouteId, DirectionId, RouteId } from "../schedule.d"

interface DataDiscrepancyData {
  attribute: string
  sources: DataDiscrepancySourceData[]
}

interface DataDiscrepancySourceData {
  id: string
  value: string
}

type RawHeadwaySpacing =
  | "very_bunched"
  | "bunched"
  | "ok"
  | "gapped"
  | "very_gapped"
  | null

interface VehicleScheduledLocationData {
  direction_id: DirectionId
  timepoint_status: VehicleTimepointStatusData
}

interface VehicleStopStatusData {
  status: VehicleStatus
  stop_id: string
  stop_name: string
}

interface VehicleTimepointStatusData {
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
  headway_spacing: RawHeadwaySpacing
  previous_vehicle_id: string
  schedule_adherence_secs: number
  schedule_adherence_string: string
  scheduled_headway_secs: number
  is_off_course: boolean
  is_laying_over: boolean
  layover_departure_time: number | null
  block_is_active: boolean
  sources: string[]
  data_discrepancies: DataDiscrepancyData[]
  stop_status: VehicleStopStatusData
  timepoint_status: VehicleTimepointStatusData | null
  scheduled_location: VehicleScheduledLocationData | null
}

interface VehiclesForRouteData {
  on_route_vehicles: VehicleData[]
  incoming_vehicles: VehicleData[]
}

interface State {
  channelsByRouteId: ByRouteId<Channel>
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>
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

const headwaySpacing = (raw: RawHeadwaySpacing): HeadwaySpacing | null => {
  switch (raw) {
    case null:
      return null

    case "very_bunched":
      return HeadwaySpacing.VeryBunched

    case "bunched":
      return HeadwaySpacing.Bunched

    case "ok":
      return HeadwaySpacing.Ok

    case "gapped":
      return HeadwaySpacing.Gapped

    case "very_gapped":
      return HeadwaySpacing.VeryGapped
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
    vehiclesForRoute: VehiclesForRoute
  }
}

const setVehiclesForRoute = (
  routeId: RouteId,
  vehiclesForRoute: VehiclesForRoute
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
    case "REMOVE_ROUTE":
      const {
        [action.payload.routeId]: _channel,
        ...channelsWithoutRouteId
      } = state.channelsByRouteId
      const {
        [action.payload.routeId]: _vehiclesForRoute,
        ...vehiclesByRouteIdWithoutRouteId
      } = state.vehiclesByRouteId
      return {
        ...state,
        channelsByRouteId: channelsWithoutRouteId,
        vehiclesByRouteId: vehiclesByRouteIdWithoutRouteId,
      }
    default:
      return state
  }
}

const dataDiscrepanciesFromData = (
  dataDiscrepancies: DataDiscrepancyData[]
): DataDiscrepancy[] =>
  dataDiscrepancies.map(dataDiscrepancy => ({
    attribute: dataDiscrepancy.attribute,
    sources: dataDiscrepancy.sources,
  }))

const vehicleScheduledLocationFromData = (
  vehicleScheduledLocationData: VehicleScheduledLocationData
): VehicleScheduledLocation => ({
  directionId: vehicleScheduledLocationData.direction_id,
  timepointStatus: vehicleTimepointStatusFromData(
    vehicleScheduledLocationData.timepoint_status
  ),
})

const vehicleStopStatusFromData = (
  vehicleStopStatusData: VehicleStopStatusData
): VehicleStopStatus => ({
  status: vehicleStopStatusData.status,
  stopId: vehicleStopStatusData.stop_id,
  stopName: vehicleStopStatusData.stop_name,
})

const vehicleTimepointStatusFromData = (
  vehicleTimepointStatusData: VehicleTimepointStatusData
): VehicleTimepointStatus => ({
  timepointId: vehicleTimepointStatusData.timepoint_id,
  fractionUntilTimepoint: vehicleTimepointStatusData.fraction_until_timepoint,
})

const vehicleFromData = ({ isOnRoute }: { isOnRoute: boolean }) => (
  vehicleData: VehicleData
): Vehicle => ({
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
  headwaySpacing: headwaySpacing(vehicleData.headway_spacing),
  previousVehicleId: vehicleData.previous_vehicle_id,
  scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
  scheduleAdherenceString: vehicleData.schedule_adherence_string,
  scheduledHeadwaySecs: vehicleData.scheduled_headway_secs,
  isOffCourse: vehicleData.is_off_course,
  isLayingOver: vehicleData.is_laying_over,
  layoverDepartureTime: vehicleData.layover_departure_time,
  blockIsActive: vehicleData.block_is_active,
  dataDiscrepancies: dataDiscrepanciesFromData(vehicleData.data_discrepancies),
  stopStatus: vehicleStopStatusFromData(vehicleData.stop_status),
  timepointStatus:
    vehicleData.timepoint_status &&
    vehicleTimepointStatusFromData(vehicleData.timepoint_status),
  scheduledLocation:
    vehicleData.scheduled_location &&
    vehicleScheduledLocationFromData(vehicleData.scheduled_location),
  isOnRoute,
})

const vehiclesForRouteFromData = (
  vehiclesForRouteData: VehiclesForRouteData
): VehiclesForRoute => ({
  onRouteVehicles: vehiclesForRouteData.on_route_vehicles.map(
    vehicleFromData({ isOnRoute: true })
  ),
  incomingVehicles: vehiclesForRouteData.incoming_vehicles.map(
    vehicleFromData({ isOnRoute: false })
  ),
})

const subscribe = (
  socket: Socket,
  routeId: RouteId,
  dispatch: Dispatch
): Channel => {
  const handleVehicles = (vehiclesForRouteData: VehiclesForRouteData) => {
    const vehiclesForRoute = vehiclesForRouteFromData(vehiclesForRouteData)
    dispatch(setVehiclesForRoute(routeId, vehiclesForRoute))
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
): ByRouteId<VehiclesForRoute> => {
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
