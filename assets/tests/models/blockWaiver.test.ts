import { jest, describe, test, expect } from "@jest/globals"
import { AlertIconStyle } from "../../src/components/iconAlertCircle"
import {
  blockWaiverAlertStyle,
  currentFuturePastType,
  CurrentFuturePastType,
  hasBlockWaiver,
  hasCurrentBlockWaiver,
} from "../../src/models/blockWaiver"
import { BlockWaiver, VehicleInScheduledService } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2020-02-25T16:10:00.000Z"))

const currentBlockWaiver: BlockWaiver = {
  startTime: new Date("2020-02-25T15:53:20.000Z"),
  endTime: new Date("2020-02-25T16:26:40.000Z"),
  causeId: 0,
  causeDescription: "Block Waiver",
  remark: null,
}

const futureBlockWaiver: BlockWaiver = {
  startTime: new Date("2020-02-25T20:26:40.000Z"),
  endTime: new Date("2020-02-25T20:43:20.000Z"),
  causeId: 0,
  causeDescription: "Block Waiver",
  remark: null,
}

const pastBlockWaiver: BlockWaiver = {
  startTime: new Date("2020-02-25T15:36:40.000Z"),
  endTime: new Date("2020-02-25T15:53:20.000Z"),
  causeId: 0,
  causeDescription: "Block Waiver",
  remark: null,
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
    const vehicleWithBlockWaivers: VehicleInScheduledService = {
      blockWaivers: [currentBlockWaiver],
    } as VehicleInScheduledService

    expect(hasBlockWaiver(vehicleWithBlockWaivers)).toBeTruthy()
  })

  test("returns false if the vehicle or ghost has no block waivers", () => {
    const vehicleWithoutBlockWaivers: VehicleInScheduledService = {
      blockWaivers: [] as BlockWaiver[],
    } as VehicleInScheduledService
    expect(hasBlockWaiver(vehicleWithoutBlockWaivers)).toBeFalsy()
  })
})

describe("hasCurrentBlockWaiver", () => {
  test("returns true if the vehicle or ghost has a current block waiver", () => {
    const vehicleWithBlockWaivers: VehicleInScheduledService = {
      blockWaivers: [currentBlockWaiver],
    } as VehicleInScheduledService

    expect(hasCurrentBlockWaiver(vehicleWithBlockWaivers)).toBeTruthy()
  })

  test("considers a block waiver starting within the next 240 minutes to be current", () => {
    const vehicleWithWaiverBeforeCutoff: VehicleInScheduledService = {
      blockWaivers: [
        {
          ...currentBlockWaiver,
          startTime: new Date("2020-02-25T20:10:00.000Z"),
        },
      ],
    } as VehicleInScheduledService

    const vehicleWithWaiverAfterCutoff: VehicleInScheduledService = {
      blockWaivers: [
        {
          ...currentBlockWaiver,
          startTime: new Date("2020-02-25T20:10:00.001Z"),
        },
      ],
    } as VehicleInScheduledService

    expect(hasCurrentBlockWaiver(vehicleWithWaiverBeforeCutoff)).toBeTruthy()
    expect(hasCurrentBlockWaiver(vehicleWithWaiverAfterCutoff)).toBeFalsy()
  })

  test("returns false if the vehicle or ghost has only non-current block waivers", () => {
    const vehicleWithoutBlockWaivers: VehicleInScheduledService = {
      blockWaivers: [pastBlockWaiver],
    } as VehicleInScheduledService
    expect(hasCurrentBlockWaiver(vehicleWithoutBlockWaivers)).toBeFalsy()
  })

  test("returns false if the vehicle or ghost has no block waivers", () => {
    const vehicleWithoutBlockWaivers: VehicleInScheduledService = {
      blockWaivers: [] as BlockWaiver[],
    } as VehicleInScheduledService
    expect(hasCurrentBlockWaiver(vehicleWithoutBlockWaivers)).toBeFalsy()
  })
})

describe("blockWaiverAlertStyle", () => {
  test("vehicle with no waiver gets no icon", () => {
    const vehicle = {
      id: "id",
      blockWaivers: [] as BlockWaiver[],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(vehicle)).toEqual(undefined)
  })

  test("vehicle with a current waiver gets a black icon", () => {
    const vehicle = {
      id: "id",
      blockWaivers: [currentBlockWaiver],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(vehicle)).toEqual(AlertIconStyle.Black)
  })

  test("vehicle with a non-current waiver gets no icon", () => {
    const vehicle = {
      id: "id",
      blockWaivers: [pastBlockWaiver, futureBlockWaiver],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(vehicle)).toEqual(undefined)
  })

  test("ghost with no waiver gets a highlighted icon", () => {
    const ghost = {
      id: "ghost-id",
      blockWaivers: [] as BlockWaiver[],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(ghost)).toEqual(AlertIconStyle.Highlighted)
  })

  test("ghost with a current waiver gets a black icon", () => {
    const ghost = {
      id: "ghost-id",
      blockWaivers: [currentBlockWaiver],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(ghost)).toEqual(AlertIconStyle.Black)
  })

  test("ghost with a non-current waiver gets a highlighted icon", () => {
    const ghost = {
      id: "ghost-id",
      blockWaivers: [pastBlockWaiver],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(ghost)).toEqual(AlertIconStyle.Highlighted)
  })

  test("late indicator ghost whose vehicle has no waiver gets no alert", () => {
    const lateIndicatorGhost = {
      id: "ghost-incoming-id",
      blockWaivers: [] as BlockWaiver[],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(lateIndicatorGhost)).toEqual(undefined)
  })

  test("late indicator ghost whose vehicle has a current waiver gets an alert", () => {
    const lateIndicatorGhost = {
      id: "ghost-incoming-id",
      blockWaivers: [currentBlockWaiver],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(lateIndicatorGhost)).toEqual(
      AlertIconStyle.Black
    )
  })

  test("late indicator ghost whose vehicle has a no waiver gets no alert", () => {
    const lateIndicatorGhost = {
      id: "ghost-incoming-id",
      blockWaivers: [pastBlockWaiver, futureBlockWaiver],
    } as VehicleInScheduledService
    expect(blockWaiverAlertStyle(lateIndicatorGhost)).toEqual(undefined)
  })
})
