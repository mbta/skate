import { makeMockSocket } from "../testHelpers/socketHelpers"
import { renderHook } from "@testing-library/react"
import useVehicleForId from "../../src/hooks/useVehicleForId"
import useMostRecentVehicleById from "../../src/hooks/useMosRecentVehicleById"
import vehicleFactory from "../factories/vehicle"
import { VehicleId, VehicleOrGhost } from "../../src/realtime"

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

describe("useMostRecentVehicleById", () => {
  test("returns null when vehicle hasn't loaded yet", () => {
    const mockSocket = makeMockSocket()

    const { result } = renderHook(() =>
      useMostRecentVehicleById(mockSocket, "y1093")
    )

    expect(result.current).toBe(null)
  })

  test("returns vehicle once loaded", () => {
    const vehicleForId = vehicleFactory.build()
    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicleForId)
    const mockSocket = makeMockSocket()

    const { result } = renderHook(() =>
      useMostRecentVehicleById(mockSocket, "y1093")
    )

    expect(result.current).toBe(vehicleForId)
  })

  test("returns old vehicle until the new one has loaded", () => {
    const firstVehicle = vehicleFactory.build({ id: "y1093" })
    const secondVehicle = vehicleFactory.build({ id: "y2088" })

    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(firstVehicle)
    const mockSocket = makeMockSocket()

    const { result, rerender } = renderHook(
      (id: VehicleId) => useMostRecentVehicleById(mockSocket, id),
      { initialProps: firstVehicle.id }
    )
    rerender(secondVehicle.id)

    expect(result.current).toBe(firstVehicle)
    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(secondVehicle)
    rerender(secondVehicle.id)
    expect(result.current).toBe(secondVehicle)
  })

  test("returns null when passed a null vehicle id", () => {
    const firstVehicle = vehicleFactory.build({ id: "y1093" })

    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(firstVehicle)
    const mockSocket = makeMockSocket()

    const { result, rerender } = renderHook<
      VehicleOrGhost | null,
      string | null
    >((id) => useMostRecentVehicleById(mockSocket, id), {
      initialProps: firstVehicle.id,
    })
    expect(result.current).toBe(firstVehicle)

    rerender(null)
    expect(result.current).toBe(null)
  })

  test("when a vehicle is selected, cleared, and a new selection made, returns null until the latest vehicle loads", () => {
    const firstVehicle = vehicleFactory.build({ id: "y1093" })
    const secondVehicle = vehicleFactory.build({ id: "y2088" })

    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(firstVehicle)
    const mockSocket = makeMockSocket()

    const { result, rerender } = renderHook<
      VehicleOrGhost | null,
      string | null
    >((id) => useMostRecentVehicleById(mockSocket, id), {
      initialProps: firstVehicle.id,
    })
    expect(result.current).toBe(firstVehicle)

    rerender(null)
    expect(result.current).toBe(null)

    // second vehicle hasn't loaded yet
    rerender(secondVehicle.id)
    expect(result.current).toBe(null)

    // second vehicle has loaded
    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(secondVehicle)
    rerender(secondVehicle.id)
    expect(result.current).toBe(secondVehicle)
  })
})
