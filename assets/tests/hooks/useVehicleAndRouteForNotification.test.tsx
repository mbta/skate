import { renderHook } from "@testing-library/react-hooks"
import { Socket } from "phoenix"
import React, { ReactElement } from "react"
import { RouteData } from "../../src/api"
import { SocketProvider } from "../../src/contexts/socketContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import useVehicleAndRouteForNotification, {
  VehicleOrGhostAndRouteData,
} from "../../src/hooks/useVehicleAndRouteForNotification"
import { GhostData, VehicleData } from "../../src/models/vehicleData"
import { NotificationReason } from "../../src/realtime"
import { initialState } from "../../src/state"
import { dateFromEpochSeconds } from "../../src/util/dateTime"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

const routeData: RouteData = {
  id: "39",
  direction_names: { "0": "Outbound", "1": "Inbound" },
  name: "39",
}

const ghostData: GhostData = {
  id: "ghost-5678",
  direction_id: 0,
  route_id: "39",
  trip_id: "12345678",
  headsign: "Forest Hills",
  block_id: "S12-34",
  run_id: "123-4567",
  via_variant: "3",
  layover_departure_time: null,
  scheduled_timepoint_status: {
    timepoint_id: "shunt",
    fraction_until_timepoint: 0.3342478185618462,
  },
  route_status: "on_route",
  block_waivers: [],
}

const vehicleData: VehicleData = {
  id: "y1234",
  label: "1234",
  run_id: "123-4567",
  timestamp: 1600946090,
  latitude: 42.32172773,
  longitude: -71.11216123,
  direction_id: 0,
  route_id: "39",
  trip_id: "12345678",
  headsign: "Forest Hills",
  via_variant: "3",
  operator_id: "12345",
  operator_name: "CHARLIE",
  operator_logon_time: 1600946282,
  bearing: 0,
  block_id: "S12-34",
  headway_secs: 0,
  headway_spacing: null,
  previous_vehicle_id: "123",
  schedule_adherence_secs: 156,
  scheduled_headway_secs: 360,
  is_shuttle: false,
  is_overload: false,
  is_off_course: false,
  layover_departure_time: null,
  sources: [],
  data_discrepancies: [],
  stop_status: {
    stop_id: "61365",
    stop_name: "S Huntington Ave @ Perkins St",
  },
  timepoint_status: {
    timepoint_id: "shunt",
    fraction_until_timepoint: 0.3342478185618462,
  },
  scheduled_location: {
    route_id: "39",
    direction_id: 0,
    trip_id: "12345678",
    run_id: "123-4567",
    time_since_trip_start_time: 1321,
    headsign: "Forest Hills",
    via_variant: "3",
    timepoint_status: {
      timepoint_id: "jpctr",
      fraction_until_timepoint: 0.3277777777777778,
    },
  },
  route_status: "on_route",
  end_of_trip_type: "another_trip",
  block_waivers: [],
  crowding: {
    load: 1,
    capacity: 57,
    occupancy_status: "MANY_SEATS_AVAILABLE",
    occupancy_percentage: 0.018,
  },
}

const wrapper = (socket: Socket | undefined) => ({
  children,
}: {
  children: ReactElement<HTMLElement>
}) => (
  <SocketProvider
    socketStatus={{ socket, connectionStatus: ConnectionStatus.Connected }}
  >
    <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
      {children}
    </StateDispatchProvider>
  </SocketProvider>
)

describe("useVehicleAndRouteForNotification", () => {
  const notification = {
    id: 123,
    createdAt: new Date(),
    tripIds: ["123", "456", "789"],
    reason: "other" as NotificationReason,
    routeIds: [],
    runIds: [],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date(),
  }

  test("parses vehicle and route data from channel", () => {
    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }
    window.username = "username"

    const vehicleAndRouteData: VehicleOrGhostAndRouteData = {
      vehicleOrGhostData: vehicleData,
      routeData,
    }
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: vehicleAndRouteData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    // tslint:disable: react-hooks-nesting
    const { result } = renderHook(
      () => {
        return useVehicleAndRouteForNotification(notification)
      },
      { wrapper: wrapper(mockSocket) }
    )

    expect(result.current).toEqual({
      route: {
        directionNames: { "0": "Outbound", "1": "Inbound" },
        id: "39",
        name: "39",
      },
      vehicleOrGhost: {
        bearing: 0,
        blockId: "S12-34",
        blockWaivers: [],
        crowding: {
          capacity: 57,
          load: 1,
          occupancyPercentage: 0.018,
          occupancyStatus: "MANY_SEATS_AVAILABLE",
        },
        dataDiscrepancies: [],
        directionId: 0,
        endOfTripType: "another_trip",
        headsign: "Forest Hills",
        headwaySecs: 0,
        headwaySpacing: null,
        id: "y1234",
        isOffCourse: false,
        isOverload: false,
        isShuttle: false,
        label: "1234",
        latitude: 42.32172773,
        layoverDepartureTime: null,
        longitude: -71.11216123,
        operatorId: "12345",
        operatorLogonTime: dateFromEpochSeconds(
          vehicleData.operator_logon_time!
        ),
        operatorName: "CHARLIE",
        previousVehicleId: "123",
        routeId: "39",
        routeStatus: "on_route",
        runId: "123-4567",
        scheduleAdherenceSecs: 156,
        scheduledHeadwaySecs: 360,
        scheduledLocation: {
          directionId: 0,
          headsign: "Forest Hills",
          routeId: "39",
          runId: "123-4567",
          timeSinceTripStartTime: 1321,
          timepointStatus: {
            fractionUntilTimepoint: 0.3277777777777778,
            timepointId: "jpctr",
          },
          tripId: "12345678",
          viaVariant: "3",
        },
        stopStatus: {
          stopId: "61365",
          stopName: "S Huntington Ave @ Perkins St",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.3342478185618462,
          timepointId: "shunt",
        },
        timestamp: 1600946090,
        tripId: "12345678",
        viaVariant: "3",
      },
    })
    expect(window.FS!.event).toHaveBeenCalledWith("Notification linked to VPP")
    window.FS = originalFS
    window.username = originalUsername
  })

  test("parses ghost and route data from channel", () => {
    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }
    window.username = "username"

    const vehicleAndRouteData: VehicleOrGhostAndRouteData = {
      vehicleOrGhostData: ghostData,
      routeData,
    }
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: vehicleAndRouteData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    // tslint:disable: react-hooks-nesting
    const { result } = renderHook(
      () => {
        return useVehicleAndRouteForNotification(notification)
      },
      { wrapper: wrapper(mockSocket) }
    )

    expect(result.current).toEqual({
      route: {
        directionNames: { "0": "Outbound", "1": "Inbound" },
        id: "39",
        name: "39",
      },
      vehicleOrGhost: {
        blockId: "S12-34",
        blockWaivers: [],
        directionId: 0,
        headsign: "Forest Hills",
        id: "ghost-5678",
        layoverDepartureTime: null,
        routeId: "39",
        routeStatus: "on_route",
        runId: "123-4567",
        scheduledTimepointStatus: {
          fractionUntilTimepoint: 0.3342478185618462,
          timepointId: "shunt",
        },
        tripId: "12345678",
        viaVariant: "3",
      },
    })
    expect(window.FS!.event).toHaveBeenCalledWith(
      "Notification linked to ghost"
    )
    window.FS = originalFS
    window.username = originalUsername
  })

  test("handles missing data from channel", () => {
    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }
    window.username = "username"

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: {} })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    // tslint:disable: react-hooks-nesting
    const { result } = renderHook(
      () => {
        return useVehicleAndRouteForNotification(notification)
      },
      { wrapper: wrapper(mockSocket) }
    )
    expect(result.current).toBeNull()
    expect(window.FS!.event).toHaveBeenCalledWith("Notification link failed")
    window.FS = originalFS
    window.username = originalUsername
  })
})
