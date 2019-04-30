import { renderHook } from "react-hooks-testing-library"
import useSocket from "../../src/hooks/useSocket"

// tslint:disable: react-hooks-nesting

const mockSocket = {
  connect: jest.fn(),
}

jest.mock("phoenix", () => ({
  Socket: jest.fn(() => mockSocket),
  __esModule: true,
}))

describe("useVehicles", () => {
  test("vehicles is empty to start with", () => {
    const { result } = renderHook(() => useSocket())

    expect(mockSocket.connect).toHaveBeenCalled()
    expect(result.current).toBe(mockSocket)
  })
})
