import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverBanner from "../../../src/components/propertiesPanel/blockWaiverBanner"
import { BlockWaiver } from "../../../src/realtime"
import * as dateTime from "../../../src/util/dateTime"

describe("BlockWaiverBanner", () => {
  jest
    .spyOn(dateTime, "now")
    .mockImplementation(() => new Date("2020-02-25T16:10:00.000Z"))

  test("renders a current time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:53:20.000Z"),
      endTime: new Date("2020-02-25T16:26:40.000Z"),
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a future time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T16:26:40.000Z"),
      endTime: new Date("2020-02-25T16:43:20.000Z"),
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a past time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:36:40.000Z"),
      endTime: new Date("2020-02-25T15:53:20.000Z"),
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
