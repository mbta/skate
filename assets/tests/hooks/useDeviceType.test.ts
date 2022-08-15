import { useMediaQueries } from "@react-hook/media-query"
const useDeviceType = jest.requireActual(
  "../../src/hooks/useDeviceType"
).default

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
          mobile_landscape_tablet_portrait: false,
          tablet: false,
        },
        matchesAny: true,
        matchesAll: false,
      }
    })

    expect(useDeviceType()).toBe("mobile")
  })

  test("returns mobile landscape / tablet portrair when media query matches", () => {
    ;(useMediaQueries as jest.Mock).mockImplementationOnce(() => {
      return {
        matches: {
          mobile: false,
          mobile_landscape_tablet_portrait: true,
          tablet: false,
        },
        matchesAny: true,
        matchesAll: false,
      }
    })

    expect(useDeviceType()).toBe("mobile_landscape_tablet_portrait")
  })

  test("returns tablet when media query matches tablet", () => {
    ;(useMediaQueries as jest.Mock).mockImplementationOnce(() => {
      return {
        matches: {
          mobile: false,
          mobile_landscape_tablet_portrait: false,
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
          mobile_landscape_tablet_portrait: false,
          tablet: false,
        },
        matchesAny: false,
        matchesAll: false,
      }
    })

    expect(useDeviceType()).toBe("desktop")
  })
})
