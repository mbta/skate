import vehicleLabel, {
  labelToLabel,
  runIdToLabel,
} from "../../src/helpers/vehicleLabel"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"
import { Settings, VehicleLabelSetting } from "../../src/settings"

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
  headsign: null,
  viaVariant: null,
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
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  isLayingOver: false,
  layoverDepartureTime: null,
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

describe("vehicleLabel", () => {
  test("uses the run ID for the label given the run number setting", () => {
    expect(
      vehicleLabel(vehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("2000")
  })

  test("uses the vehicle label for the label given the vehicle number setting", () => {
    expect(
      vehicleLabel(vehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as Settings)
    ).toEqual("0479")
  })
})

describe("runIdToLabel", () => {
  test("converts runId to readable label", () => {
    expect(runIdToLabel(vehicle)).toEqual("2000")
  })

  test("returns N/A if vehicle has no runId", () => {
    expect(runIdToLabel({ ...vehicle, runId: null })).toEqual("N/A")
  })
})

describe("labelToLabel", () => {
  test("returns the vehicle's label", () => {
    expect(labelToLabel(vehicle)).toEqual("0479")
  })
})
