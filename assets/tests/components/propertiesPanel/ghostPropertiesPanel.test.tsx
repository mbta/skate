import React from "react"
import renderer from "react-test-renderer"
import GhostPropertiesPanel from "../../../src/components/propertiesPanel/ghostPropertiesPanel"
import { BlockWaiver, Ghost } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as blockWaiverBanner from "../../../src/components/propertiesPanel/blockWaiverBanner"

jest.spyOn(blockWaiverBanner, "nowEpochSeconds").mockImplementation(() => 81720)

// Enable feature flags
jest.mock("../../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

const ghost: Ghost = {
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: "123-0123",
  viaVariant: "X",
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  routeStatus: "on_route",
  blockWaivers: [],
}

const route: Route = {
  id: "39",
  directionNames: {
    0: "Outbound",
    1: "Inbound",
  },
  name: "39",
}

describe("GhostPropertiesPanel", () => {
  test("renders", () => {
    const tree = renderer
      .create(<GhostPropertiesPanel selectedGhost={ghost} route={route} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost with missing run", () => {
    const ghostWithoutRun: Ghost = { ...ghost, runId: null }
    const tree = renderer
      .create(
        <GhostPropertiesPanel selectedGhost={ghostWithoutRun} route={route} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost with block waivers", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 18300,
      endTime: 45480,
      remark: "E:1106",
    }
    const ghostWithBlockWaivers: Ghost = {
      ...ghost,
      blockWaivers: [blockWaiver],
    }

    const tree = renderer
      .create(<GhostPropertiesPanel selectedGhost={ghostWithBlockWaivers} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
