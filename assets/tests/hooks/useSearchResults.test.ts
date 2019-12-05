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
import { mockUseStateOnce } from "../testHelpers/mockHelpers"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

// tslint:disable: react-hooks-nesting
// tslint:disable: object-literal-sort-keys

describe("useSearchResults", () => {
  test("returns undefined initially", () => {
    const { result } = renderHook(() =>
      useSearchResults(undefined, initialSearch)
    )
    expect(result.current).toEqual(undefined)
  })

  test("initializing the hook subscribes to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = {
      text: "test",
      property: "run",
      isActive: true,
      savedSearches: [],
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

    const invalidSearch: Search = {
      text: "",
      property: "run",
      isActive: false,
      savedSearches: [],
    }

    renderHook(() =>
      useSearchResults((mockSocket as any) as Socket, invalidSearch)
    )

    expect(mockSocket.channel).toHaveBeenCalledTimes(0)
    expect(mockChannel.join).toHaveBeenCalledTimes(0)
  })

  test("initializing the hook with an inactive search does not subscribe to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = {
      text: "test",
      property: "run",
      isActive: false,
      savedSearches: [],
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
        route_status: "on_route",
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
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
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
        routeStatus: "on_route",
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
      isActive: true,
      savedSearches: [],
    }
    const { result } = renderHook(() =>
      useSearchResults((mockSocket as any) as Socket, search)
    )

    expect(result.current).toEqual(vehicles)
  })

  test("leaves the channel on unmount", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    const vehicles: Vehicle[] = []
    mockUseStateOnce(vehicles)
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockUseStateOnce(mockChannel)

    const search: Search = {
      text: "one",
      property: "run",
      isActive: true,
      savedSearches: [],
    }
    const { unmount } = renderHook(() =>
      useSearchResults((mockSocket as any) as Socket, search)
    )

    unmount()

    expect(mockChannel.leave).toHaveBeenCalled()
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

    const search1: Search = {
      text: "one",
      property: "run",
      isActive: true,
      savedSearches: [],
    }
    const { rerender } = renderHook(
      search => useSearchResults((mockSocket as any) as Socket, search),
      { initialProps: search1 }
    )

    const search2: Search = {
      text: "two",
      property: "run",
      isActive: true,
      savedSearches: [],
    }
    rerender(search2)

    expect(channel1.leave).toHaveBeenCalled()
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel when typing even if there is no new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search1: Search = {
      text: "validSearch",
      property: "run",
      isActive: true,
      savedSearches: [],
    }
    const { rerender } = renderHook(
      search => useSearchResults((mockSocket as any) as Socket, search),
      { initialProps: search1 }
    )

    const search2: Search = {
      text: "",
      property: "run",
      isActive: false,
      savedSearches: [],
    }
    rerender(search2)

    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(msg => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const search: Search = {
      text: "test",
      property: "run",
      isActive: true,
      savedSearches: [],
    }

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

    const search: Search = {
      text: "test",
      property: "run",
      isActive: true,
      savedSearches: [],
    }

    renderHook(() => useSearchResults((mockSocket as any) as Socket, search))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
