import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverList from "../../../src/components/propertiesPanel/blockWaiverList"
import { BlockWaiver } from "../../../src/realtime"
import * as blockWaiverBanner from "../../../src/components/propertiesPanel/blockWaiverBanner"

jest.spyOn(blockWaiverBanner, "nowEpochSeconds").mockImplementation(() => 81720)

describe("BlockWaiverList", () => {
  test("renders", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 18300,
      endTime: 45480,
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverList blockWaivers={[blockWaiver]} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
