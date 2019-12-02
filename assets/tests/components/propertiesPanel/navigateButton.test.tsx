import { mount } from "enzyme"
import React from "react"
import NavigateButton from "../../../src/components/propertiesPanel/navigateButton"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../../src/realtime"
import { deselectVehicle, initialState, selectRoute } from "../../../src/state"

const mockHistoryPush = jest.fn()
jest.mock("react-router-dom", () => ({
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}))

const vehicle: Vehicle = {
  id: "v1",
  label: "v1-label",
  runId: "run-1",
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "39",
  tripId: "t1",
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: "op1",
  operatorName: "SMITH",
  bearing: 33,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  layoverDepartureTime: null,
  blockIsActive: false,
  dataDiscrepancies: [
    {
      attribute: "trip_id",
      sources: [
        {
          id: "swiftly",
          value: "swiftly-trip-id",
        },
        {
          id: "busloc",
          value: "busloc-trip-id",
        },
      ],
    },
  ],
  stopStatus: {
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    timepointId: "tp1",
    fractionUntilTimepoint: 0.5,
  },
  scheduledLocation: null,
  routeStatus: "on_route",
}
const shuttle: Vehicle = {
  ...vehicle,
  runId: "999-0555",
}
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

describe("NavigateButton", () => {
  test("renders a View on Route Ladder button for a ghost", () => {
    const wrapper = mount(<NavigateButton selectedVehicleOrGhost={ghost} />)
    const button = wrapper.find(".m-properties-panel__navigate-button")

    expect(button.text()).toMatch(/View on Route Ladder/)
  })

  test("renders a View on Route Ladder button for a non-shuttle vehicle", () => {
    const wrapper = mount(<NavigateButton selectedVehicleOrGhost={vehicle} />)
    const button = wrapper.find(".m-properties-panel__navigate-button")

    expect(button.text()).toMatch(/View on Route Ladder/)
  })

  test("renders a View on Shuttle Map button for a shuttle", () => {
    const wrapper = mount(<NavigateButton selectedVehicleOrGhost={shuttle} />)
    const button = wrapper.find(".m-properties-panel__navigate-button")

    expect(button.text()).toMatch(/View on Shuttle Map/)
  })

  test("clicking View on Route Ladder selects the vehicle's route", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <NavigateButton selectedVehicleOrGhost={ghost} />
      </StateDispatchProvider>
    )
    const button = wrapper.find(".m-properties-panel__navigate-button")

    button.simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(selectRoute(ghost.routeId))
  })

  test("clicking View on Route Ladder deselects the vehicle", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <NavigateButton selectedVehicleOrGhost={ghost} />
      </StateDispatchProvider>
    )
    const button = wrapper.find(".m-properties-panel__navigate-button")

    button.simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(deselectVehicle())
  })

  test("clicking View on Route Ladder takes you to the route ladder", () => {
    const wrapper = mount(<NavigateButton selectedVehicleOrGhost={ghost} />)
    const button = wrapper.find(".m-properties-panel__navigate-button")

    button.simulate("click")

    expect(mockHistoryPush).toHaveBeenCalledWith("/")
  })

  test("clicking View on Shuttle Map deselects the vehicle", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <NavigateButton selectedVehicleOrGhost={shuttle} />
      </StateDispatchProvider>
    )
    const button = wrapper.find(".m-properties-panel__navigate-button")

    button.simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(deselectVehicle())
  })

  test("clicking View on Shuttle Map takes you to the route ladder", () => {
    const wrapper = mount(<NavigateButton selectedVehicleOrGhost={shuttle} />)
    const button = wrapper.find(".m-properties-panel__navigate-button")

    button.simulate("click")

    expect(mockHistoryPush).toHaveBeenCalledWith("/shuttle-map")
  })
})
