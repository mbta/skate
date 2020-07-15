import React from "react"
import renderer from "react-test-renderer"
import GhostPropertiesPanel from "../../../src/components/propertiesPanel/ghostPropertiesPanel"
import { BlockWaiver, Ghost } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as dateTime from "../../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("1970-01-01T22:42:00.000Z"))

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
      .create(
        <GhostPropertiesPanel selectedGhost={ghost} route={route} routes={[]} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost with missing run", () => {
    const ghostWithoutRun: Ghost = { ...ghost, runId: null }
    const tree = renderer
      .create(
        <GhostPropertiesPanel
          selectedGhost={ghostWithoutRun}
          route={route}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost with block waivers", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("1970-01-01T05:05:00.000Z"),
      endTime: new Date("1970-01-01T12:38:00.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const ghostWithBlockWaivers: Ghost = {
      ...ghost,
      blockWaivers: [blockWaiver],
    }

    const tree = renderer
      .create(
        <GhostPropertiesPanel
          selectedGhost={ghostWithBlockWaivers}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
