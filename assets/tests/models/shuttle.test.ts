import { formattedRunNumber } from "../../src/models/shuttle"
import { Vehicle } from "../../src/realtime"

describe("formattedRunNumber", () => {
  test("removes the dash and the leading zero from the second part of the run ID string", () => {
    const shuttle = { runId: "999-0555" } as Vehicle

    expect(formattedRunNumber(shuttle)).toEqual("999 555")
  })

  test("adds the line as a prefix if this a subway shuttle run", () => {
    const shuttle = { runId: "999-0502" } as Vehicle

    expect(formattedRunNumber(shuttle)).toEqual("Green 999 502")
  })

  test("returns Not Available if the run ID is null", () => {
    const shuttle = { runId: null } as Vehicle

    expect(formattedRunNumber(shuttle)).toEqual("Not Available")
  })
})
