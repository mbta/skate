import { renderHook } from "@testing-library/react-hooks"
import { Socket } from "phoenix"
import useSearchResults from "../../src/hooks/useSearchResults"
import { initialSearch, Search } from "../../src/models/search"
import { VehicleData, VehicleOrGhostData } from "../../src/models/vehicleData"
import {
  Vehicle,
  VehicleOrGhost,
  VehicleTimepointStatus,
} from "../../src/realtime"
import { mockUseReducerOnce } from "../testHelpers/mockHelpers"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

// tslint:disable: react-hooks-nesting
// tslint:disable: object-literal-sort-keys

describe("useSearchResults", () => {
  test("returns null while loading", () => {
    const { result } = renderHook(() =>
      useSearchResults(undefined, initialSearch)
    )
    expect(result.current).toEqual(null)
  })

  test("initializing the hook subscribes to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = {
      text: "test",
      property: "run",
    }

    renderHook(() => useSearchResults((mockSocket as any) as Socket, search))

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:search:run:test")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("initializing the hook with an invalid search does not subscribe to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = {
      text: "",
      property: "run",
    }

    renderHook(() => useSearchResults((mockSocket as any) as Socket, search))

    expect(mockSocket.channel).toHaveBeenCalledTimes(0)
    expect(mockChannel.join).toHaveBeenCalledTimes(0)
  })

  test("returns results pushed to the channel", async () => {
    const searchResultsData: VehicleOrGhostData[] = [
      {
        bearing: 33,
        block_id: "block-1",
        block_is_active: true,
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
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: null,
        label: "v1-label",
        latitude: 0,
        longitude: 0,
        operator_id: "op1",
        operator_name: "SMITH",
        previous_vehicle_id: "v2",
        route_id: "39",
        run_id: "run-1",
        schedule_adherence_secs: 0,
        schedule_adherence_string: "0.0 sec (ontime)",
        scheduled_headway_secs: 120,
        scheduled_location: {
          direction_id: 0,
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
      } as VehicleData,
    ]
    const vehicles: VehicleOrGhost[] = [
      {
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
        operatorName: "SMITH",
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: null,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        isLayingOver: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
        } as VehicleTimepointStatus,
        scheduledLocation: {
          directionId: 0,
          timepointStatus: {
            timepointId: "tp1",
            fractionUntilTimepoint: 0.5,
          },
        },
        isOnRoute: true,
      } as Vehicle,
    ]

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "search") {
        handler({
          data: searchResultsData,
        })
      }
    })

    const search: Search = {
      text: "test",
      property: "run",
    }
    const { result } = renderHook(() =>
      useSearchResults((mockSocket as any) as Socket, search)
    )

    expect(result.current).toEqual(vehicles)
  })

  test("leaves the channel on unmount", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementation(() => mockChannel)

    const mockState = {
      channel: mockChannel,
      vehicles: [],
    }
    const mockDispatch = jest.fn()
    mockUseReducerOnce([mockState, mockDispatch])

    const search: Search = {
      text: "one",
      property: "run",
    }
    const { unmount } = renderHook(() =>
      useSearchResults((mockSocket as any) as Socket, search)
    )

    unmount()

    expect(mockChannel.leave).toHaveBeenCalled()
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(msg => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = { text: "test", property: "run" }

    renderHook(() => useSearchResults((mockSocket as any) as Socket, search))

    expect(spyConsoleError).toHaveBeenCalledWith(
      "search channel join failed",
      "ERROR_REASON"
    )
    spyConsoleError.mockRestore()
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(window.location, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = { text: "test", property: "run" }

    renderHook(() => useSearchResults((mockSocket as any) as Socket, search))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
