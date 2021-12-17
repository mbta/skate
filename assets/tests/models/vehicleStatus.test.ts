import {
  drawnStatus,
  humanReadableScheduleAdherence,
  onTimeStatus,
  statusClasses,
} from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime.d"
import {
  defaultUserSettings,
  VehicleAdherenceColorsSetting,
} from "../../src/userSettings"

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
    const vehicle: Vehicle = {
      id: "y0001",
      scheduleAdherenceSecs: 0,
      isOffCourse: true,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("off-course")
  })

  test("returns 'plain' for a shuttle, even if off-course", () => {
    const shuttle: Vehicle = {
      id: "y0001",
      scheduleAdherenceSecs: 0,
      isShuttle: true,
      isOffCourse: true,
    } as Vehicle
    expect(drawnStatus(shuttle)).toEqual("plain")
  })

  test("return scheduled status", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      scheduleAdherenceSecs: 500,
      isOffCourse: false,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("late")
  })
})

describe("humanReadableScheduleAdherence", () => {
  test("returns invalid for an off course vehicle", () => {
    const vehicle: Vehicle = {
      scheduleAdherenceSecs: 0,
      isOffCourse: true,
    } as Vehicle
    expect(humanReadableScheduleAdherence(vehicle)).toEqual("Invalid")
  })

  test("returns on time status for an on course vehicle", () => {
    const onTime: Vehicle = {
      scheduleAdherenceSecs: 5,
    } as Vehicle
    expect(humanReadableScheduleAdherence(onTime)).toEqual("on time")
    const early: Vehicle = {
      scheduleAdherenceSecs: -500,
    } as Vehicle
    expect(humanReadableScheduleAdherence(early)).toEqual("early")
    const late: Vehicle = {
      scheduleAdherenceSecs: 500,
    } as Vehicle
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
