import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverBanner, * as blockWaiverBanner from "../../../src/components/propertiesPanel/blockWaiverBanner"
import { BlockWaiver } from "../../../src/realtime"

const { formatEpochSeconds, nowEpochSeconds } = blockWaiverBanner

describe("BlockWaiverBanner", () => {
  jest
    .spyOn(blockWaiverBanner, "nowEpochSeconds")
    .mockImplementation(() => 1582647000)

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

describe("formatEpochSeconds", () => {
  test("formats an epoch time in seconds nicely", () => {
    expect(formatEpochSeconds(1582628000)).toEqual("10:53am")
    expect(formatEpochSeconds(1582632500)).toEqual("12:08pm")
    expect(formatEpochSeconds(1582641000)).toEqual("2:30pm")
  })
})

describe("nowEpochSeconds", () => {
  test("returns an epoch time in seconds (defaulting to now)", () => {
    expect(nowEpochSeconds(1582647451124)).toEqual(1582647451)
  })
})
