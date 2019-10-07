import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import GhostPropertiesPanel from "../../../src/components/propertiesPanel/ghostPropertiesPanel"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { Ghost } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import { deselectVehicle, initialState } from "../../../src/state"

const ghost: Ghost = {
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: "123-0123",
  viaVariant: "X",
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
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

  test("clicking the Close button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <GhostPropertiesPanel selectedGhost={ghost} route={route} />
      </StateDispatchProvider>
    )
    wrapper.find(".m-properties-panel__close-button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
  })
})
