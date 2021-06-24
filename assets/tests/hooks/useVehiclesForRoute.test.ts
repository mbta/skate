import { renderHook } from "@testing-library/react-hooks"
import useVehiclesForRoute from "../../src/hooks/useVehiclesForRoute"
import { VehicleOrGhostData } from "../../src/models/vehicleData"
import { VehicleOrGhost } from "../../src/realtime"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

// tslint:disable: react-hooks-nesting

describe("useVehiclesForRoute", () => {
  test("returns null initially", () => {
    const { result } = renderHook(() => useVehiclesForRoute(undefined, "1"))
    expect(result.current).toEqual(null)
  })

  test("does not join a channel if route is null", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useVehiclesForRoute(mockSocket, null))

    expect(mockSocket.channel).toHaveBeenCalledTimes(0)
    expect(mockChannel.join).toHaveBeenCalledTimes(0)
  })

  test("subscribes to a channel and returns results", () => {
    const vehicleData: VehicleOrGhostData = {
      id: "id",
      direction_id: 0,
      route_id: "1",
      trip_id: "trip",
      headsign: "headsign",
      block_id: "block",
      run_id: null,
      via_variant: null,
      layover_departure_time: null,
      scheduled_timepoint_status: {
        timepoint_id: "timepoint",
        fraction_until_timepoint: 0,
      },
      scheduled_logon: null,
      route_status: "on_route",
      block_waivers: [],
    }
    const vehicle: VehicleOrGhost = {
      id: "id",
      directionId: 0,
      routeId: "1",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "timepoint",
        fractionUntilTimepoint: 0,
      },
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
    }

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: [vehicleData] })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useVehiclesForRoute(mockSocket, "1"))

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:route:1")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual([vehicle])
  })
})
