import { describe, test, expect } from "@jest/globals"
import {
  makeMockOneShotChannel,
  makeMockSocket,
} from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"
import { renderHook } from "@testing-library/react"
import useVehicleForId from "../../src/hooks/useVehicleForId"

describe("useVehicleForId", () => {
  test("parses vehicle data from channel", () => {
    const vehicleData = vehicleDataFactory.build()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockOneShotChannel(vehicleData)
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(({ id }) => useVehicleForId(mockSocket, id), {
      initialProps: { id: vehicleData.id },
    })

    expect(result.current).toMatchObject({ id: vehicleData.id })
  })

  test("null vehicle should call useChannel with null topic", () => {
    const vehicleData = vehicleDataFactory.build()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockOneShotChannel(vehicleData)
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useVehicleForId(mockSocket, null))

    expect(result.current).toBe(undefined)
    expect(mockChannel.on).not.toHaveBeenCalled()
  })
})
