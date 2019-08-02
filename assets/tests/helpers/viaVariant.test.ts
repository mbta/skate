import { getViaVariant } from "../../src/helpers/viaVariant"

describe("getViaVariant", () => {
  test("returns the via variant from a routePatternId", () => {
    expect(getViaVariant("57A-X-0")).toEqual("X")
  })

  test("returns _ variants", () => {
    expect(getViaVariant("57A-_-0")).toEqual("_")
  })

  test("tolerates missing input", () => {
    expect(getViaVariant(null)).toEqual(null)
    expect(getViaVariant(undefined)).toEqual(null)
    expect(getViaVariant("")).toEqual(null)
  })

  test("returns null on route patterns it doesn't recognize", () => {
    expect(getViaVariant("bad-route-pattern-format")).toEqual(null)
  })
})
