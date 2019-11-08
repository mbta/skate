import vehicleLabel, {
  ghostLabel,
  labelToLabel,
  runIdToLabel,
} from "../../src/helpers/vehicleLabel"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
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

  test("uses the shuttle vehicle label setting if the vehicle is a shuttle", () => {
    const shuttle = {
      ...vehicle,
      runId: "999-2000",
    }

    expect(
      vehicleLabel(shuttle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as Settings)
    ).toEqual("0479")
  })
})

describe("ghostLabel", () => {
  const ghost: Ghost = {
    id: "ghost",
    directionId: 0,
    routeId: "route",
    tripId: "trip",
    headsign: "headsign",
    blockId: "block",
    runId: null,
    viaVariant: null,
    scheduledTimepointStatus: {
      timepointId: "timepoint",
      fractionUntilTimepoint: 0.0,
    },
  }

  test("shows run id without area", () => {
    expect(
      ghostLabel({ ...ghost, runId: "123-1234" }, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("1234")
  })

  test("shows N/A for run id if it's missing", () => {
    expect(
      ghostLabel({ ...ghost, runId: null }, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("N/A")
  })

  test("shows N/A for vehicle number", () => {
    expect(
      ghostLabel(ghost, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as Settings)
    ).toEqual("N/A")
  })
})

describe("runIdToLabel", () => {
  test("converts runId to readable label", () => {
    expect(runIdToLabel(vehicle)).toEqual("2000")
  })

  test("strips the leading zero if the vehicle is a shuttle", () => {
    const shuttle = {
      ...vehicle,
      runId: "999-0555",
    }

    expect(runIdToLabel(shuttle)).toEqual("555")
  })

  test("does not strip a non-zero leading number if the vehicle is a shuttle", () => {
    const shuttle = {
      ...vehicle,
      runId: "999-1555",
    }

    expect(runIdToLabel(shuttle)).toEqual("1555")
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
