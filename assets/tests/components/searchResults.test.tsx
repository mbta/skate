import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SearchResults from "../../src/components/searchResults"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { setSearchText } from "../../src/models/search"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import { initialState, selectVehicle, State } from "../../src/state"

const state: State = {
  ...initialState,
  search: {
    text: "test",
    property: "run",
    isActive: true,
  },
}

describe("SearchResults", () => {
  test("renders no results", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults vehicles={[]} />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a list of results including vehicles and ghosts", () => {
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
        fractionUntilTimepoint: 0.5,
        timepointId: "tp1",
      },
      scheduledLocation: null,
      routeStatus: "on_route",
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

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults vehicles={[vehicle, ghost]} />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a selected result card", () => {
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
        fractionUntilTimepoint: 0.5,
        timepointId: "tp1",
      },
      scheduledLocation: null,
      routeStatus: "on_route",
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

    const stateWithSelected = {
      ...state,
      selectedVehicleId: vehicle.id,
    }

    const tree = renderer
      .create(
        <StateDispatchProvider state={stateWithSelected} dispatch={jest.fn()}>
          <SearchResults vehicles={[vehicle, ghost]} />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a result card selects that vehicle", () => {
    const testDispatch = jest.fn()
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
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={testDispatch}>
        <SearchResults vehicles={[vehicle]} />
      </StateDispatchProvider>
    )

    wrapper.find(".m-search-results__card").simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(selectVehicle("v1"))
  })

  test("clicking the clear search button empties the search text", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={testDispatch}>
        <SearchResults vehicles={[]} />
      </StateDispatchProvider>
    )

    wrapper.find(".m-search-results__clear-search-button").simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(setSearchText(""))
  })
})
