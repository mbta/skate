import { describe, test, expect } from "@jest/globals"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  onTimeStatus,
  statusClasses,
} from "../../src/models/vehicleStatus"
import { Vehicle, VehicleInScheduledService } from "../../src/realtime"
import {
  defaultUserSettings,
  VehicleAdherenceColorsSetting,
} from "../../src/userSettings"
import { vehicleFactory } from "../factories/vehicle"

describe("onTimeStatus", () => {
  test("returns on-time", () => {
    expect(onTimeStatus(5)).toEqual("on-time")
  })

  test("return late", () => {
    expect(onTimeStatus(500)).toEqual("late")
  })

  test("returns early", () => {
    expect(onTimeStatus(-500)).toEqual("early")
  })
})

describe("drawnStatus", () => {
  test("returns 'off-course' if isOffCourse", () => {
    const vehicle: VehicleInScheduledService = {
      id: "y0001",
      scheduleAdherenceSecs: 0,
      isOffCourse: true,
    } as VehicleInScheduledService
    expect(drawnStatus(vehicle)).toEqual("off-course")
  })

  test("returns 'plain' for a shuttle, even if off-course", () => {
    const shuttle: VehicleInScheduledService = {
      id: "y0001",
      scheduleAdherenceSecs: 0,
      isShuttle: true,
      isOffCourse: true,
    } as VehicleInScheduledService
    expect(drawnStatus(shuttle)).toEqual("plain")
  })

  test("returns 'logged-out' for a logged out vehicle", () => {
    const vehicle = vehicleFactory.build({
      runId: null,
      blockId: undefined,
      operatorLogonTime: null,
    })
    expect(drawnStatus(vehicle)).toEqual("logged-out")
  })

  test("return scheduled status", () => {
    const vehicle: VehicleInScheduledService = {
      id: "y0001",
      scheduleAdherenceSecs: 500,
      isOffCourse: false,
    } as VehicleInScheduledService
    expect(drawnStatus(vehicle)).toEqual("late")
  })

  test("returns 'plain' for all other vehicles", () => {
    const vehicle: Vehicle = vehicleFactory.build({
      isShuttle: false,
    })
    vehicle.scheduleAdherenceSecs = null
    expect(drawnStatus(vehicle)).toEqual("plain")
  })
})

describe("humanReadableScheduleAdherence", () => {
  test("returns invalid for an off course vehicle", () => {
    const vehicle: VehicleInScheduledService = {
      scheduleAdherenceSecs: 0,
      isOffCourse: true,
    } as VehicleInScheduledService
    expect(humanReadableScheduleAdherence(vehicle)).toEqual("Invalid")
  })

  test("returns on time status for an on course vehicle", () => {
    const onTime: VehicleInScheduledService = {
      scheduleAdherenceSecs: 5,
    } as VehicleInScheduledService
    expect(humanReadableScheduleAdherence(onTime)).toEqual("on time")
    const early: VehicleInScheduledService = {
      scheduleAdherenceSecs: -500,
    } as VehicleInScheduledService
    expect(humanReadableScheduleAdherence(early)).toEqual("early")
    const late: VehicleInScheduledService = {
      scheduleAdherenceSecs: 500,
    } as VehicleInScheduledService
    expect(humanReadableScheduleAdherence(late)).toEqual("late")
  })

  test("returns status for a vehicle that is pulling back when flag is set", () => {
    const vehicle = vehicleFactory.build({
      endOfTripType: "pull_back",
      stopStatus: { stopId: null, stopName: null },
    })

    expect(humanReadableScheduleAdherence(vehicle, true)).toEqual("Logged In")
  })
})

describe("statusClasses", () => {
  test("no class for plain", () => {
    expect(
      statusClasses("plain", defaultUserSettings.vehicleAdherenceColors)
    ).toEqual([""])
  })

  test("correct class for logged out", () => {
    expect(
      statusClasses("logged-out", defaultUserSettings.vehicleAdherenceColors)
    ).toEqual(["logged-out"])
  })

  describe("other statuses have a class", () => {
    test("early-red by default", () => {
      expect(
        statusClasses("off-course", defaultUserSettings.vehicleAdherenceColors)
      ).toEqual(["off-course", "early-red"])
    })

    test("early-blue if user setting is `EarlyBlue`", () => {
      expect(
        statusClasses("off-course", VehicleAdherenceColorsSetting.EarlyBlue)
      ).toEqual(["off-course", "early-blue"])
    })
  })
})
