import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals"
import { renderHook } from "@testing-library/react"
import * as UseScreenSize from "../../src/hooks/useScreenSize"

const useScreenSize = jest.requireActual<typeof UseScreenSize>(
  "../../src/hooks/useScreenSize"
).default

jest.mock("@react-hook/media-query", () => ({
  __esModule: true,
  useMediaQueries: jest.fn(() => {}),
}))

const windowInnerWidthBeforeSpy = window.innerWidth
beforeAll(() => {
  Object.defineProperty(window, "innerWidth", {
    get: jest.fn(),
    set: jest.fn(),
    configurable: true,
  })
})

afterAll(() => {
  jest
    .spyOn(window, "innerWidth", "get")
    .mockReturnValue(windowInnerWidthBeforeSpy)
})

const mockWindowWidth = (value: number) =>
  jest.spyOn(window, "innerWidth", "get").mockReturnValue(value)

describe("useScreenSize", () => {
  test.only.each([
    { screenWidth: 0, deviceType: "mobile" },
    { screenWidth: 480, deviceType: "mobile" },
    { screenWidth: 481, deviceType: "mobile_landscape_tablet_portrait" },
    { screenWidth: 800, deviceType: "mobile_landscape_tablet_portrait" },
    { screenWidth: 801, deviceType: "tablet" },
    { screenWidth: 1340, deviceType: "tablet" },
    { screenWidth: 1341, deviceType: "desktop" },
    { screenWidth: 2000, deviceType: "desktop" },
    { screenWidth: 4000, deviceType: "desktop" },
  ])(
    "when screen size is '$screenWidth' should return '$deviceType'",
    ({ deviceType, screenWidth }) => {
      mockWindowWidth(screenWidth)
      const { result } = renderHook(useScreenSize)
      expect(result.current).toBe(deviceType)
    }
  )
})
