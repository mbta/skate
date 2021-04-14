import { renderHook } from "@testing-library/react-hooks"
import useSearchResults from "../../src/hooks/useSearchResults"
import { emptySearchQuery, SearchQuery } from "../../src/models/searchQuery"
import { VehicleData, VehicleOrGhostData } from "../../src/models/vehicleData"
import { Vehicle, VehicleOrGhost } from "../../src/realtime"
import { mockUseStateOnce } from "../testHelpers/mockHelpers"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

// tslint:disable: react-hooks-nesting
// tslint:disable: object-literal-sort-keys

describe("useSearchResults", () => {
  test("returns null initially", () => {
    const { result } = renderHook(() =>
      useSearchResults(undefined, emptySearchQuery)
    )
    expect(result.current).toEqual(null)
  })

  test("initializing the hook subscribes to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const searchQuery: SearchQuery = {
      text: "test",
      property: "run",
    }

    renderHook(() => useSearchResults(mockSocket, searchQuery))

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:search:run:test")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("initializing the hook without a search query does not subscribe to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useSearchResults(mockSocket, null))

    expect(mockSocket.channel).toHaveBeenCalledTimes(0)
    expect(mockChannel.join).toHaveBeenCalledTimes(0)
  })

  test("returns results pushed to the channel", () => {
    const vehicleData: VehicleData = {
      bearing: 33,
      block_id: "block-1",
      data_discrepancies: [
        {
          attribute: "trip_id",
          sources: [
            {
              id: "swiftly",
              value: "swiftly-trip-id",
            },
            {
              id: "busloc",
              value: "busloc-trip-id",
            },
          ],
        },
        {
          attribute: "route_id",
          sources: [
            {
              id: "swiftly",
              value: null,
            },
            {
              id: "busloc",
              value: "busloc-route-id",
            },
          ],
        },
      ],
      direction_id: 0,
      headsign: "Forest Hills",
      headway_secs: 859.1,
      headway_spacing: null,
      id: "v1",
      is_shuttle: false,
      is_overload: false,
      is_off_course: false,
      is_revenue: true,
      layover_departure_time: null,
      label: "v1-label",
      latitude: 0,
      longitude: 0,
      operator_id: "op1",
      operator_first_name: "PATTI",
      operator_last_name: "SMITH",
      operator_logon_time: 1_534_340_301,
      previous_vehicle_id: "v2",
      route_id: "39",
      run_id: "run-1",
      schedule_adherence_secs: 0,
      scheduled_headway_secs: 120,
      scheduled_location: {
        route_id: "39",
        direction_id: 0,
        trip_id: "scheduled trip",
        run_id: "scheduled run",
        time_since_trip_start_time: 0,
        headsign: "scheduled headsign",
        via_variant: "scheduled via variant",
        timepoint_status: {
          timepoint_id: "tp1",
          fraction_until_timepoint: 0.5,
        },
      },
      sources: ["swiftly", "busloc"],
      stop_status: {
        stop_id: "s1",
        stop_name: "Stop Name",
      },
      timepoint_status: {
        timepoint_id: "tp1",
        fraction_until_timepoint: 0.5,
      },
      timestamp: 123,
      trip_id: "t1",
      via_variant: "X",
      route_status: "on_route",
      end_of_trip_type: "another_trip",
      block_waivers: [],
      crowding: null,
    }
    const searchResultsData: VehicleOrGhostData[] = [vehicleData]
    const vehicle: Vehicle = {
      id: "v1",
      label: "v1-label",
      runId: "run-1",
      timestamp: 123,
      latitude: 0,
      longitude: 0,
      directionId: 0,
      routeId: "39",
      tripId: "t1",
      headsign: "Forest Hills",
      viaVariant: "X",
      operatorId: "op1",
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block-1",
      headwaySecs: 859.1,
      headwaySpacing: null,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduledHeadwaySecs: 120,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
      dataDiscrepancies: [
        {
          attribute: "trip_id",
          sources: [
            {
              id: "swiftly",
              value: "swiftly-trip-id",
            },
            {
              id: "busloc",
              value: "busloc-trip-id",
            },
          ],
        },
        {
          attribute: "route_id",
          sources: [
            {
              id: "swiftly",
              value: null,
            },
            {
              id: "busloc",
              value: "busloc-route-id",
            },
          ],
        },
      ],
      stopStatus: {
        stopId: "s1",
        stopName: "Stop Name",
      },
      timepointStatus: {
        timepointId: "tp1",
        fractionUntilTimepoint: 0.5,
      },
      scheduledLocation: {
        routeId: "39",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "tp1",
          fractionUntilTimepoint: 0.5,
        },
      },
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: null,
    }
    const vehicles: VehicleOrGhost[] = [vehicle]

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: searchResultsData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const searchQuery: SearchQuery = {
      text: "test",
      property: "run",
    }
    const { result } = renderHook(() =>
      useSearchResults(mockSocket, searchQuery)
    )

    expect(result.current).toEqual(vehicles)
  })

  test("leaves the channel and joins a new one when the search changes", () => {
    const mockSocket = makeMockSocket()
    const vehicles: Vehicle[] = []
    const channel1 = makeMockChannel("ok")
    const channel2 = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)
    mockUseStateOnce(vehicles)
    mockUseStateOnce(channel1)
    mockUseStateOnce(vehicles)
    mockUseStateOnce(channel2)

    const search1: SearchQuery = {
      text: "one",
      property: "run",
    }
    const { rerender } = renderHook(
      (searchQuery) => useSearchResults(mockSocket, searchQuery),
      { initialProps: search1 }
    )

    const search2: SearchQuery = {
      text: "two",
      property: "run",
    }
    rerender(search2)

    expect(channel1.leave).toHaveBeenCalled()
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel when typing even if there is no new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search1: SearchQuery | null = {
      text: "validSearch",
      property: "run",
    }
    const { rerender } = renderHook(
      (searchQuery) => useSearchResults(mockSocket, searchQuery),
      { initialProps: search1 as SearchQuery | null }
    )

    const search2: SearchQuery | null = null
    rerender(search2)

    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
  })
})
