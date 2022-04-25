import { useMediaQueries } from "@react-hook/media-query"
import useDeviceType from "../../src/hooks/useDeviceType"

jest.mock("@react-hook/media-query", () => ({
  __esModule: true,
  useMediaQueries: jest.fn(() => {}),
}))

describe("useDeviceType", () => {
  test("returns mobile when media query matches mobile", () => {
    ;(useMediaQueries as jest.Mock).mockImplementationOnce(() => {
      return {
        matches: {
          mobile: true,
          tablet: false,
        },
        matchesAny: true,
        matchesAll: false,
      }
    })

    expect(useDeviceType()).toBe("mobile")
  })

  test("returns tablet when media query matches tablet", () => {
    ;(useMediaQueries as jest.Mock).mockImplementationOnce(() => {
      return {
        matches: {
          mobile: false,
          tablet: true,
        },
        matchesAny: true,
        matchesAll: false,
      }
    })

    expect(useDeviceType()).toBe("tablet")
  })

  test("returns desktop in other cases", () => {
    ;(useMediaQueries as jest.Mock).mockImplementationOnce(() => {
      return {
        matches: {
          mobile: false,
          tablet: false,
        },
        matchesAny: false,
        matchesAll: false,
      }
    })

    expect(useDeviceType()).toBe("desktop")
  })
})
