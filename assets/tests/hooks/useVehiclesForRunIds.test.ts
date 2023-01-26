import { renderHook } from "@testing-library/react"
import useVehiclesForRunIds from "../../src/hooks/useVehiclesForRunIds"
import { VehicleData, vehicleFromData } from "../../src/models/vehicleData"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"

const vehicleData: VehicleData = vehicleDataFactory.build()

describe("useVehiclesForRunIds", () => {
  test("returns data", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: [vehicleData] })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => {
      return useVehiclesForRunIds(mockSocket, [vehicleData.run_id!])
    })
    expect(result.current).toEqual([vehicleFromData(vehicleData)])
  })
})
