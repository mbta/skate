import { useMediaQuery } from "@react-hook/media-query"
const useDeviceSupportsHover = jest.requireActual(
  "../../src/hooks/useDeviceSupportsHover"
).default

jest.mock("@react-hook/media-query", () => ({
  __esModule: true,
  useMediaQuery: jest.fn(() => false),
}))

describe("useDeviceSupports", () => {
  test("returns true when media query for hover matches", () => {
    ;(useMediaQuery as jest.Mock).mockReturnValueOnce(true)

    expect(useDeviceSupportsHover()).toBe(true)
  })

  test("returns false when media query for hover doesn't match", () => {
    ;(useMediaQuery as jest.Mock).mockReturnValueOnce(false)

    expect(useDeviceSupportsHover()).toBe(false)
  })
})
