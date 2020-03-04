import {
  currentFuturePastType,
  CurrentFuturePastType,
} from "../../src/models/blockWaiver"
import { BlockWaiver } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"

describe("currentFuturePastType", () => {
  jest
    .spyOn(dateTime, "now")
    .mockImplementation(() => new Date("2020-02-25T16:10:00.000Z"))

  test("returns current for an active waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:53:20.000Z"),
      endTime: new Date("2020-02-25T16:26:40.000Z"),
      remark: "E:1106",
    }
    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Current
    )
  })

  test("future for a future waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T16:26:40.000Z"),
      endTime: new Date("2020-02-25T16:43:20.000Z"),
      remark: "E:1106",
    }
    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Future
    )
  })

  test("renders past for a past waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:36:40.000Z"),
      endTime: new Date("2020-02-25T15:53:20.000Z"),
      remark: "E:1106",
    }
    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Past
    )
  })
})
