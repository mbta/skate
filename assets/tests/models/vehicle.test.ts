import { isShuttle } from "../../src/models/vehicle"
import { Vehicle } from "../../src/realtime"

describe("isShuttle", () => {
  test("true if the vehicle's runId starts with 999", () => {
    const shuttle = { runId: "999-0555" } as Vehicle
    const notShuttle = { runId: "998-0555" } as Vehicle

    expect(isShuttle(shuttle)).toBeTruthy()
    expect(isShuttle(notShuttle)).toBeFalsy()
  })
})
