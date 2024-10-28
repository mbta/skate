import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverList from "../../../src/components/propertiesPanel/blockWaiverList"
import { BlockWaiver } from "../../../src/realtime"
import * as dateTime from "../../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("1970-01-01T22:42:00.000Z"))

describe("BlockWaiverList", () => {
  test("renders", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("1970-01-01T05:05:00.000Z"),
      endTime: new Date("1970-01-01T12:38:00.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const tree = renderer
      .create(<BlockWaiverList blockWaivers={[blockWaiver]} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
