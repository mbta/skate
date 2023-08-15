import { jest, describe, test, expect } from "@jest/globals"
import { useMediaQuery } from "@react-hook/media-query"
import * as UseDeviceSupportsHover from "../../src/hooks/useDeviceSupportsHover"

const useDeviceSupportsHover = jest.requireActual<
  typeof UseDeviceSupportsHover
>("../../src/hooks/useDeviceSupportsHover").default

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
