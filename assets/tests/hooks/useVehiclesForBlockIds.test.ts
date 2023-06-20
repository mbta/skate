import { renderHook } from "@testing-library/react"
import useVehicleForBlockIds from "../../src/hooks/useVehiclesForBlockIds"
import { vehicleFromData } from "../../src/models/vehicleData"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"

describe("useVehiclesForBlockIds", () => {
  test("returns data", () => {
    const vehicleData = vehicleDataFactory.build()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: [vehicleData] })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => {
      return useVehicleForBlockIds(mockSocket, ["S12-34"])
    })
    expect(result.current).toEqual([vehicleFromData(vehicleData)])
  })
})
