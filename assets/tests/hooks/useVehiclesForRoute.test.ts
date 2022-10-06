import { renderHook } from "@testing-library/react"
import useVehiclesForRoute from "../../src/hooks/useVehiclesForRoute"
import { VehicleOrGhostData } from "../../src/models/vehicleData"
import { VehicleOrGhost } from "../../src/realtime"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import ghostFactory from "../factories/ghost"
import ghostDataFactory from "../factories/ghost_data"

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
    const vehicleData: VehicleOrGhostData = ghostDataFactory.build({
      id: "id",
      trip_id: "a_trip",
    })
    const vehicle: VehicleOrGhost = ghostFactory.build({
      id: "id",
      tripId: "a_trip",
    })

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
