import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverBanner from "../../../src/components/propertiesPanel/blockWaiverBanner"
import { BlockWaiver } from "../../../src/realtime"
import * as dateTime from "../../../src/util/dateTime"

describe("BlockWaiverBanner", () => {
  jest.spyOn(dateTime, "nowEpochSeconds").mockImplementation(() => 1582647000)

  test("renders a current time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 1582646000,
      endTime: 1582648000,
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a future time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 1582648000,
      endTime: 1582649000,
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a past time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 1582645000,
      endTime: 1582646000,
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
