import { formattedRunNumber } from "../../src/models/shuttle"
import { Vehicle } from "../../src/realtime"

describe("formattedRunNumber", () => {
  test("removes the dash and the leading zero from the second part of the run ID string", () => {
    const shuttle = { runId: "999-0556" } as Vehicle

    expect(formattedRunNumber(shuttle)).toEqual("999 556")
  })

  test("adds the line as a prefix if this a subway shuttle run", () => {
    const blueShuttle = { runId: "999-0501" } as Vehicle
    const greenShuttle = { runId: "999-0502" } as Vehicle
    const orangeShuttle = { runId: "999-0503" } as Vehicle
    const redShuttle = { runId: "999-0504" } as Vehicle
    const crShuttle = { runId: "999-0505" } as Vehicle
    const specialShuttle = { runId: "999-0555" } as Vehicle

    expect(formattedRunNumber(blueShuttle)).toEqual("Blue 999 501")
    expect(formattedRunNumber(greenShuttle)).toEqual("Green 999 502")
    expect(formattedRunNumber(orangeShuttle)).toEqual("Orange 999 503")
    expect(formattedRunNumber(redShuttle)).toEqual("Red 999 504")
    expect(formattedRunNumber(crShuttle)).toEqual("Commuter Rail 999 505")
    expect(formattedRunNumber(specialShuttle)).toEqual("Special 999 555")
  })

  test("returns Not Available if the run ID is null", () => {
    const shuttle = { runId: null } as Vehicle

    expect(formattedRunNumber(shuttle)).toEqual("Not Available")
  })
})
