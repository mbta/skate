import { describe, test, expect } from "@jest/globals"
import vehicleLabel, {
  runOrBusNumberLabel,
  runIdToLabel,
} from "../../src/helpers/vehicleLabel"
import { VehicleInScheduledService } from "../../src/realtime"
import { UserSettings, VehicleLabelSetting } from "../../src/userSettings"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"

const vehicle: VehicleInScheduledService = vehicleFactory.build({
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
  operatorFirstName: "QUINCY",
  operatorLastName: "JONES",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
  isRevenue: true,
  layoverDepartureTime: null,
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
  crowding: null,
})

describe("vehicleLabel", () => {
  test("displays 'SW-OFF' for a swinging off vehicle, regardless of settings", () => {
    const swingingOffVehicle: VehicleInScheduledService = {
      ...vehicle,
      endOfTripType: "swing_off",
    }

    expect(
      vehicleLabel(swingingOffVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("SW-OFF")
    expect(
      vehicleLabel(swingingOffVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("SW-OFF")
  })

  test("displays 'PULL-B' for a pulling back vehicle, regardless of settings", () => {
    const pullingBackVehicle: VehicleInScheduledService = {
      ...vehicle,
      endOfTripType: "pull_back",
    }

    expect(
      vehicleLabel(pullingBackVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("PULL-B")
    expect(
      vehicleLabel(pullingBackVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("PULL-B")
  })

  test("displays 'ADDED' for an overloaded vehicle given the run number setting", () => {
    const overloadedVehicle: VehicleInScheduledService = {
      ...vehicle,
      isOverload: true,
    }

    expect(
      vehicleLabel(overloadedVehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("ADDED")
  })

  test("uses the vehicle run ID for the label given the run number setting and not overloaded", () => {
    expect(
      vehicleLabel(vehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("2000")
  })

  test("uses the vehicle label for the label given the vehicle number setting", () => {
    expect(
      vehicleLabel(vehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("0479")
  })

  test("uses the shuttle vehicle label setting if the vehicle is a shuttle", () => {
    const shuttle = {
      ...vehicle,
      isShuttle: true,
    }

    expect(
      vehicleLabel(shuttle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("0479")
  })

  test("shows ghost run id without area", () => {
    expect(
      vehicleLabel(ghostFactory.build({ runId: "123-1234" }), {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("1234")
  })

  test("shows N/A for ghost run id if it's missing", () => {
    expect(
      vehicleLabel(ghostFactory.build({ runId: null }), {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("N/A")
  })

  test("shows N/A for ghost vehicle number", () => {
    expect(
      vehicleLabel(ghostFactory.build(), {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("N/A")
  })
})

describe("runOrBusNumberLabel", () => {
  test("uses the vehicle run ID for the label given the run number setting and not overloaded", () => {
    expect(
      runOrBusNumberLabel(vehicle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("2000")
  })

  test("uses the vehicle label for the label given the vehicle number setting", () => {
    expect(
      runOrBusNumberLabel(vehicle, {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("0479")
  })

  test("uses the shuttle vehicle label setting if the vehicle is a shuttle", () => {
    const shuttle = {
      ...vehicle,
      isShuttle: true,
    }

    expect(
      runOrBusNumberLabel(shuttle, {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
    ).toEqual("0479")
  })

  test("shows ghost run id without area", () => {
    expect(
      runOrBusNumberLabel(ghostFactory.build({ runId: "123-1234" }), {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("1234")
  })

  test("shows N/A for ghost run id if it's missing", () => {
    expect(
      runOrBusNumberLabel(ghostFactory.build({ runId: null }), {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      } as UserSettings)
    ).toEqual("N/A")
  })

  test("shows N/A for ghost vehicle number", () => {
    expect(
      runOrBusNumberLabel(ghostFactory.build(), {
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      } as UserSettings)
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
