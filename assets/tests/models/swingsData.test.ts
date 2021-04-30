import { Swing } from "../../src/schedule"
import { SwingData, swingsFromData } from "../../src/models/swingsData"

describe("swingsFromData", () => {
  test("handles data", () => {
    const data: SwingData[] = [
      {
        from_route_id: "1",
        from_run_id: "123-456",
        from_trip_id: "1234",
        to_route_id: "1",
        to_run_id: "123-789",
        to_trip_id: "5678",
        time: 100,
      },
    ]

    const swings: Swing[] = swingsFromData(data)
    expect(swings).toEqual([
      {
        fromRouteId: "1",
        fromRunId: "123-456",
        fromTripId: "1234",
        toRouteId: "1",
        toRunId: "123-789",
        toTripId: "5678",
        time: 100,
      },
    ])
  })
})
