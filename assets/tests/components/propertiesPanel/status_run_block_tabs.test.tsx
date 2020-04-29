import React from "react"
import renderer from "react-test-renderer"
import StatusRunBlockTabs from "../../../src/components/propertiesPanel/status_run_block_tabs"

describe("StatusRunBlockTabs", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <StatusRunBlockTabs
          activeTripId={null}
          statusContent={<>Test content</>}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
