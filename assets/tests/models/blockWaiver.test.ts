import { AlertIconStyle } from "../../src/components/iconAlertCircle"
import {
  blockWaiverAlertStyle,
  currentFuturePastType,
  CurrentFuturePastType,
  hasBlockWaiver,
  hasCurrentBlockWaiver,
} from "../../src/models/blockWaiver"
import { BlockWaiver, Vehicle } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2020-02-25T16:10:00.000Z"))

const currentBlockWaiver: BlockWaiver = {
  startTime: new Date("2020-02-25T15:53:20.000Z"),
  endTime: new Date("2020-02-25T16:26:40.000Z"),
  remark: "E:1106",
}

const futureBlockWaiver: BlockWaiver = {
  startTime: new Date("2020-02-25T16:26:40.000Z"),
  endTime: new Date("2020-02-25T16:43:20.000Z"),
  remark: "E:1106",
}

const pastBlockWaiver: BlockWaiver = {
  startTime: new Date("2020-02-25T15:36:40.000Z"),
  endTime: new Date("2020-02-25T15:53:20.000Z"),
  remark: "E:1106",
}

describe("currentFuturePastType", () => {
  test("returns current for an active waiver", () => {
    expect(currentFuturePastType(currentBlockWaiver)).toEqual(
      CurrentFuturePastType.Current
    )
  })

  test("future for a future waiver", () => {
    expect(currentFuturePastType(futureBlockWaiver)).toEqual(
      CurrentFuturePastType.Future
    )
  })

  test("renders past for a past waiver", () => {
    expect(currentFuturePastType(pastBlockWaiver)).toEqual(
      CurrentFuturePastType.Past
    )
  })
})

describe("hasBlockWaiver", () => {
  test("returns true if the vehicle or ghost has block waivers", () => {
    const vehicleWithBlockWaivers: Vehicle = {
      blockWaivers: [currentBlockWaiver],
    } as Vehicle

    expect(hasBlockWaiver(vehicleWithBlockWaivers)).toBeTruthy()
  })

  test("returns false if the vehicle or ghost has no block waivers", () => {
    const vehicleWithoutBlockWaivers: Vehicle = {
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle
    expect(hasBlockWaiver(vehicleWithoutBlockWaivers)).toBeFalsy()
  })
})

describe("hasCurrentBlockWaiver", () => {
  test("returns true if the vehicle or ghost has a current block waiver", () => {
    const vehicleWithBlockWaivers: Vehicle = {
      blockWaivers: [currentBlockWaiver],
    } as Vehicle

    expect(hasCurrentBlockWaiver(vehicleWithBlockWaivers)).toBeTruthy()
  })

  test("returns false if the vehicle or ghost has only non-current block waivers", () => {
    const vehicleWithoutBlockWaivers: Vehicle = {
      blockWaivers: [pastBlockWaiver],
    } as Vehicle
    expect(hasCurrentBlockWaiver(vehicleWithoutBlockWaivers)).toBeFalsy()
  })

  test("returns false if the vehicle or ghost has no block waivers", () => {
    const vehicleWithoutBlockWaivers: Vehicle = {
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle
    expect(hasCurrentBlockWaiver(vehicleWithoutBlockWaivers)).toBeFalsy()
  })
})

describe("blockWaiverAlertStyle", () => {
  test("vehicle with no waiver gets no icon", () => {
    const vehicle = {
      id: "id",
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle
    expect(blockWaiverAlertStyle(vehicle)).toEqual(undefined)
  })

  test("vehicle with a current waiver gets a black icon", () => {
    const vehicle = {
      id: "id",
      blockWaivers: [currentBlockWaiver],
    } as Vehicle
    expect(blockWaiverAlertStyle(vehicle)).toEqual(AlertIconStyle.Black)
  })

  test("vehicle with a non-current waiver gets a grey icon", () => {
    const vehicle = {
      id: "id",
      blockWaivers: [pastBlockWaiver],
    } as Vehicle
    expect(blockWaiverAlertStyle(vehicle)).toEqual(AlertIconStyle.Grey)
  })

  test("ghost with no waiver gets a highlighted icon", () => {
    const ghost = {
      id: "ghost-id",
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle
    expect(blockWaiverAlertStyle(ghost)).toEqual(AlertIconStyle.Highlighted)
  })

  test("ghost with a current waiver gets a black icon", () => {
    const ghost = {
      id: "ghost-id",
      blockWaivers: [currentBlockWaiver],
    } as Vehicle
    expect(blockWaiverAlertStyle(ghost)).toEqual(AlertIconStyle.Black)
  })

  test("ghost with a non-current waiver gets a highlighted icon", () => {
    const ghost = {
      id: "ghost-id",
      blockWaivers: [pastBlockWaiver],
    } as Vehicle
    expect(blockWaiverAlertStyle(ghost)).toEqual(AlertIconStyle.Highlighted)
  })

  test("late indicator ghost whose vehicle has no waiver gets no alert", () => {
    const lateIndicatorGhost = {
      id: "ghost-incoming-id",
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle
    expect(blockWaiverAlertStyle(lateIndicatorGhost)).toEqual(undefined)
  })

  test("late indicator ghost whose vehicle has a waiver gets an alert", () => {
    const lateIndicatorGhost = {
      id: "ghost-incoming-id",
      blockWaivers: [pastBlockWaiver],
    } as Vehicle
    expect(blockWaiverAlertStyle(lateIndicatorGhost)).toEqual(
      AlertIconStyle.Grey
    )
  })
})
