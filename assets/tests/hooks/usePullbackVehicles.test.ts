import { describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import usePullbackVehicles from "../../src/hooks/usePullbackVehicles"
import { Vehicle } from "../../src/realtime.d"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"
import { vehicleFromData } from "../../src/models/vehicleData"

const pullBackVehicle = vehicleDataFactory.build({
  end_of_trip_type: "pull_back",
})
const pullBacksData = [pullBackVehicle]
const pullBacks: Vehicle[] = [vehicleFromData(pullBackVehicle)]

describe("usePullbacks", () => {
  test("returns null while loading", () => {
    const { result } = renderHook(() => usePullbackVehicles(undefined))
    expect(result.current).toEqual(null)
  })

  test("initializing the hook subscribes to the pull-backs channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() => usePullbackVehicles(mockSocket))

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:pull_backs:all")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("does not subscribe to the pull-backs channel when the subscribe argument is false", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() =>
      usePullbackVehicles(mockSocket, false)
    )

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).not.toHaveBeenCalled()
    expect(mockChannel.join).not.toHaveBeenCalled()
  })

  test("returns resulting vehicles", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: pullBacksData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => usePullbackVehicles(mockSocket))

    expect(result.current).toEqual(pullBacks)
  })
})
