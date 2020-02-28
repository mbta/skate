import vehicleLabel, { runIdToLabel } from "../../src/helpers/vehicleLabel"
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
  operatorLogonTime: 1_534_340_301,
  bearing: 33,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
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
    routeId: "1",
    directionId: 1,
    tripId: "scheduled trip",
    runId: "scheduled run",
    timeSinceTripStartTime: 0,
    headsign: "scheduled headsign",
    viaVariant: "scheduled via variant",
    timepointStatus: {
      timepointId: "MORTN",
      fractionUntilTimepoint: 0.0,
    },
  },
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}

describe("vehicleLabel", () => {
  test("displays 'SW-OFF' for a swinging off vehicle, regardless of settings", () => {
    const swingingOffVehicle: Vehicle = {
      ...vehicle,
      endOfTripType: "swing_off",
    }

    expect(
      vehicleLabel(swingingOffVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("SW-OFF")
    expect(
      vehicleLabel(swingingOffVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as Settings)
    ).toEqual("SW-OFF")
  })

  test("displays 'PULL-B' for a pulling back vehicle, regardless of settings", () => {
    const pullingBackVehicle: Vehicle = {
      ...vehicle,
      endOfTripType: "pull_back",
    }

    expect(
      vehicleLabel(pullingBackVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("PULL-B")
    expect(
      vehicleLabel(pullingBackVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as Settings)
    ).toEqual("PULL-B")
  })

  test("uses the vehicle run ID for the label given the run number setting", () => {
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

  const ghost: Ghost = {
    id: "ghost",
    directionId: 0,
    routeId: "route",
    tripId: "trip",
    headsign: "headsign",
    blockId: "block",
    runId: null,
    viaVariant: null,
    layoverDepartureTime: null,
    scheduledTimepointStatus: {
      timepointId: "timepoint",
      fractionUntilTimepoint: 0.0,
    },
    routeStatus: "on_route",
    blockWaivers: [],
  }

  test("shows ghost run id without area", () => {
    expect(
      vehicleLabel({ ...ghost, runId: "123-1234" }, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("1234")
  })

  test("shows N/A for ghost run id if it's missing", () => {
    expect(
      vehicleLabel({ ...ghost, runId: null }, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as Settings)
    ).toEqual("N/A")
  })

  test("shows N/A for ghost vehicle number", () => {
    expect(
      vehicleLabel(ghost, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as Settings)
    ).toEqual("N/A")
  })
})

describe("runIdToLabel", () => {
  test("converts runId to readable label", () => {
    expect(runIdToLabel("133-2000")).toEqual("2000")
  })

  test("strips the leading zero if the vehicle is a shuttle", () => {
    expect(runIdToLabel("999-0555")).toEqual("555")
  })

  test("does not strip a non-zero leading number if the vehicle is a shuttle", () => {
    expect(runIdToLabel("999-1555")).toEqual("1555")
  })

  test("returns N/A if vehicle has no runId", () => {
    expect(runIdToLabel(null)).toEqual("N/A")
  })
})
