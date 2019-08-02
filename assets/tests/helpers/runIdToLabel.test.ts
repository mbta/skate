import runIdToLabel from "../../src/helpers/runIdToLabel"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"

const vehicle: Vehicle = {
  id: "y0479",
  label: "0479",
  runId: "133-2000",
  timestamp: 1557160347,
  latitude: 0,
  longitude: 0,
  directionId: 1,
  routeId: "1",
  tripId: "39914128",
  operatorId: "op2",
  operatorName: "JONES",
  bearing: 33,
  speed: 50.0,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduleAdherenceStatus: "on-time",
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  blockIsActive: true,
  dataDiscrepancies: [],
  stopStatus: {
    status: "in_transit_to",
    stopId: "59",
    stopName: "59",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.0,
    timepointId: "MORTN",
  },
  scheduledLocation: {
    directionId: 1,
    timepointStatus: {
      timepointId: "MORTN",
      fractionUntilTimepoint: 0.0,
    },
  },
  isOnRoute: true,
}

describe("runIdToLabel", () => {
  test("converts runId to readable label", () => {
    expect(runIdToLabel(vehicle)).toEqual("2000")
  })

  test("returns N/A if vehicle has no runId", () => {
    expect(runIdToLabel({ ...vehicle, runId: null })).toEqual("N/A")
  })
})
