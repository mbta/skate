import featureIsEnabled from "../../src/laboratoryFeatures"
import {
  drawnStatus,
  HeadwaySpacing,
  headwaySpacingToString,
  humanReadableHeadwaySpacing,
  humanReadableScheduleAdherence,
  onTimeStatus,
  statusClass,
} from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime.d"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockHeadwaysOn = () => {
  const mockFeatureIsEnabled: jest.Mock = featureIsEnabled as jest.Mock
  mockFeatureIsEnabled.mockReturnValue(true)
}

const mockHeadwaysOff = () => {
  const mockFeatureIsEnabled: jest.Mock = featureIsEnabled as jest.Mock
  mockFeatureIsEnabled.mockReturnValue(false)
}

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
    mockHeadwaysOff()
    const vehicle: Vehicle = {
      id: "y0001",
      headwaySpacing: null,
      scheduleAdherenceSecs: 0,
      isOffCourse: true,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("off-course")
  })

  test("returns 'off-course' in headways mode", () => {
    mockHeadwaysOn()
    const vehicle: Vehicle = {
      id: "y0001",
      headwaySpacing: HeadwaySpacing.Bunched,
      scheduleAdherenceSecs: 0,
      isOffCourse: true,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("off-course")
  })

  test("returns 'plain' for a shuttle, even if off-course", () => {
    mockHeadwaysOff()
    const shuttle: Vehicle = {
      id: "y0001",
      headwaySpacing: null,
      scheduleAdherenceSecs: 0,
      isShuttle: true,
      isOffCourse: true,
    } as Vehicle
    expect(drawnStatus(shuttle)).toEqual("plain")
  })

  test("return scheduled status", () => {
    mockHeadwaysOff()
    const vehicle: Vehicle = {
      id: "y0001",
      headwaySpacing: null,
      scheduleAdherenceSecs: 500,
      isOffCourse: false,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("late")
  })

  test("prefers scheduled status to headway status if headway mode is off", () => {
    mockHeadwaysOff()
    const vehicle: Vehicle = {
      id: "y0001",
      headwaySpacing: HeadwaySpacing.Bunched,
      scheduleAdherenceSecs: 500,
      isOffCourse: false,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("late")
  })

  test("in headway mode, returns plain", () => {
    mockHeadwaysOn()
    const vehicle: Vehicle = {
      id: "y0001",
      headwaySpacing: HeadwaySpacing.Bunched,
      scheduleAdherenceSecs: 500,
      isOffCourse: false,
    } as Vehicle
    expect(drawnStatus(vehicle)).toEqual("plain")
  })

  test("in headway mode, returns schedule time if there is no headway", () => {
    mockHeadwaysOn()
    const vehicle: Vehicle = {
      id: "y0001",
      headwaySpacing: null,
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

describe("humanReadableHeadwaySpacing", () => {
  test("when given null, returns good", () => {
    expect(humanReadableHeadwaySpacing(null)).toEqual("good")
  })

  test("converts enum to string", () => {
    expect(humanReadableHeadwaySpacing(HeadwaySpacing.VeryBunched)).toEqual(
      "very bunched"
    )
    expect(humanReadableHeadwaySpacing(HeadwaySpacing.Bunched)).toEqual(
      "bunched"
    )
    expect(humanReadableHeadwaySpacing(HeadwaySpacing.Ok)).toEqual("good")
    expect(humanReadableHeadwaySpacing(HeadwaySpacing.Gapped)).toEqual("gapped")
    expect(humanReadableHeadwaySpacing(HeadwaySpacing.VeryGapped)).toEqual(
      "very gapped"
    )
  })
})

describe("headwaySpacingToString", () => {
  test("converts enum to string", () => {
    expect(headwaySpacingToString(HeadwaySpacing.VeryBunched)).toEqual(
      "very-bunched"
    )
    expect(headwaySpacingToString(HeadwaySpacing.Bunched)).toEqual("bunched")
    expect(headwaySpacingToString(HeadwaySpacing.Ok)).toEqual("ok")
    expect(headwaySpacingToString(HeadwaySpacing.Gapped)).toEqual("gapped")
    expect(headwaySpacingToString(HeadwaySpacing.VeryGapped)).toEqual(
      "very-gapped"
    )
  })
})

describe("status class", () => {
  test("no class for plain", () => {
    expect(statusClass("plain")).toEqual("")
  })

  test("other statuses have a class", () => {
    expect(statusClass("off-course")).toEqual("off-course")
  })
})
