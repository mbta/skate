import { useMediaQuery } from "@react-hook/media-query"
const useDeviceSupportsHover = jest.requireActual(
  "../../src/hooks/useDeviceSupportsHover"
).default

jest.mock("@react-hook/media-query", () => ({
  __esModule: true,
  useMediaQuery: jest.fn(() => false),
}))

describe("useDeviceSupports", () => {
  test("returns false when media query for hover:none matches", () => {
    ;(useMediaQuery as jest.Mock).mockReturnValueOnce(true)

    expect(useDeviceSupportsHover()).toBe(false)
  })

  test("returns true when media query for hover:none doesn't match", () => {
    ;(useMediaQuery as jest.Mock).mockReturnValueOnce(false)

    expect(useDeviceSupportsHover()).toBe(true)
  })
})
