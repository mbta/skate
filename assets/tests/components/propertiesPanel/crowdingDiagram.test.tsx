import React from "react"
import renderer from "react-test-renderer"
import CrowdingDiagram from "../../../src/components/propertiesPanel/crowdingDiagram"

describe("CrowdingDiagram", () => {
  test("renders nothing if route isn't considered reliable", () => {
    const tree = renderer.create(<CrowdingDiagram crowding={null} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an untrusted APC", () => {
    const untrustedApcCrowding = {
      load: null,
      capacity: null,
      occupancyStatus: null,
      occupancyPercentage: null,
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={untrustedApcCrowding} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an empty bus", () => {
    const emptyCrowding = {
      load: 0,
      capacity: 18,
      occupancyStatus: "MANY_SEATS_AVAILABLE",
      occupancyPercentage: 0.0,
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={emptyCrowding} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an uncrowded bus", () => {
    const uncrowded = {
      load: 1,
      capacity: 20,
      occupancyPercentage: 0.05,
      occupancyStatus: "MANY_SEATS_AVAILABLE",
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={uncrowded} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for a somewhat crowded bus", () => {
    const somewhatCrowded = {
      load: 10,
      capacity: 20,
      occupancyPercentage: 0.5,
      occupancyStatus: "FEW_SEATS_AVAILABLE",
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={somewhatCrowded} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for a crowded bus", () => {
    const crowded = {
      load: 45,
      capacity: 30,
      occupancyPercentage: 1.5,
      occupancyStatus: "FULL",
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={crowded} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
