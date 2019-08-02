import React from "react"
import renderer from "react-test-renderer"
import IncomingBox from "../../src/components/incomingBox"
import { LadderDirection } from "../../src/components/ladder"

describe("IncomingBox", () => {
  test("renders empty state", () => {
    const tree = renderer
      .create(
        <IncomingBox
          vehicles={[]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
