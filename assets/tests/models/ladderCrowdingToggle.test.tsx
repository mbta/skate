import { toggleLadderCrowdingForRoute } from "../../src/models/ladderCrowdingToggle"

describe("toggleLadderCrowdingForRoute", () => {
  test("toggles true, false, and undefined correctly", () => {
    const input = { "1": false, "2": true }
    expect(toggleLadderCrowdingForRoute(input, "1")).toEqual({
      "1": true,
      "2": true,
    })
    expect(toggleLadderCrowdingForRoute(input, "2")).toEqual({
      "1": false,
      "2": false,
    })
    expect(toggleLadderCrowdingForRoute(input, "3")).toEqual({
      "1": false,
      "2": true,
      "3": true,
    })
  })
})
