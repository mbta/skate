import { renderHook } from "@testing-library/react"
import useShuttleVehicles from "../../src/hooks/useShuttleVehicles"
import { Vehicle } from "../../src/realtime.d"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"
import { vehicleFromData } from "../../src/models/vehicleData"

const shuttle = vehicleDataFactory.build({ is_shuttle: true })
const shuttlesData = [shuttle]
const shuttles: Vehicle[] = [vehicleFromData(shuttle)]

describe("useShuttleVehicles", () => {
  test("returns null while loading", () => {
    const { result } = renderHook(() => useShuttleVehicles(undefined))
    expect(result.current).toEqual(null)
  })

  test("initializing the hook subscribes to the shuttles channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() => useShuttleVehicles(mockSocket))

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:shuttle:all")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns resulting vehicles", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: shuttlesData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useShuttleVehicles(mockSocket))

    expect(result.current).toEqual(shuttles)
  })
})
