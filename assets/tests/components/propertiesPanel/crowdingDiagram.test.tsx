import { describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import CrowdingDiagram from "../../../src/components/propertiesPanel/crowdingDiagram"
import { Crowding } from "../../../src/models/crowding"

describe("CrowdingDiagram", () => {
  test("renders nothing if route isn't considered reliable", () => {
    const tree = renderer.create(<CrowdingDiagram crowding={null} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an untrusted APC", () => {
    const untrustedApcCrowding = {
      load: null,
      capacity: null,
      occupancyStatus: "NO_DATA",
      occupancyPercentage: null,
    } as Crowding

    const tree = renderer
      .create(<CrowdingDiagram crowding={untrustedApcCrowding} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an empty bus", () => {
    const emptyCrowding: Crowding = {
      load: 0,
      capacity: 18,
      occupancyStatus: "EMPTY",
      occupancyPercentage: 0.0,
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={emptyCrowding} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an uncrowded bus", () => {
    const uncrowded: Crowding = {
      load: 1,
      capacity: 20,
      occupancyStatus: "MANY_SEATS_AVAILABLE",
      occupancyPercentage: 0.05,
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={uncrowded} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for a somewhat crowded bus", () => {
    const somewhatCrowded: Crowding = {
      load: 10,
      capacity: 20,
      occupancyStatus: "FEW_SEATS_AVAILABLE",
      occupancyPercentage: 0.5,
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={somewhatCrowded} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for a crowded bus", () => {
    const crowded: Crowding = {
      load: 45,
      capacity: 30,
      occupancyStatus: "FULL",
      occupancyPercentage: 1.5,
    }

    const tree = renderer
      .create(<CrowdingDiagram crowding={crowded} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
