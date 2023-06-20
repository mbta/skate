import { renderHook } from "@testing-library/react"
import useVehiclesForRunIds from "../../src/hooks/useVehiclesForRunIds"
import {
  VehicleData,
  vehicleInScheduledServiceFromData,
} from "../../src/models/vehicleData"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"

describe("useVehiclesForRunIds", () => {
  test("returns data", () => {
    const vehicleData: VehicleData = vehicleDataFactory.build()

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: [vehicleData] })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => {
      return useVehiclesForRunIds(mockSocket, [vehicleData.run_id!])
    })
    expect(result.current).toEqual([
      vehicleInScheduledServiceFromData(vehicleData),
    ])
  })
})
