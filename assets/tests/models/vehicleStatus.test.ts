import {
  drawnStatus,
  humanReadableScheduleAdherence,
  onTimeStatus,
  statusClasses,
} from "../../src/models/vehicleStatus"
import { Vehicle, VehicleInScheduledService } from "../../src/realtime.d"
import {
  defaultUserSettings,
  VehicleAdherenceColorsSetting,
} from "../../src/userSettings"
import vehicleFactory from "../factories/vehicle"

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
})

describe("statusClasses", () => {
  test("no class for plain", () => {
    expect(
      statusClasses("plain", defaultUserSettings.vehicleAdherenceColors)
    ).toEqual([""])
  })

  test("other statuses have a class", () => {
    expect(
      statusClasses("off-course", defaultUserSettings.vehicleAdherenceColors)
    ).toEqual(["off-course", "early-red"])
  })

  test("other statuses have a class", () => {
    expect(
      statusClasses("off-course", VehicleAdherenceColorsSetting.EarlyBlue)
    ).toEqual(["off-course", "early-blue"])
  })
})
