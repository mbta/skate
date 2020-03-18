import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SearchResults, {
  byOperatorLogonTime,
} from "../../src/components/searchResults"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import { initialState, selectVehicle, State } from "../../src/state"
import { setSearchText } from "../../src/state/searchPageState"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

const state: State = {
  ...initialState,
  searchPageState: {
    query: { text: "test", property: "run" },
    isActive: true,
    savedQueries: [],
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
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
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
      endOfTripType: "another_trip",
      blockWaivers: [],
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
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
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

  test("renders vehicles that have logged in within the past 30 minutes", () => {
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
      operatorLogonTime: new Date("2018-08-15T17:40:21.000Z"),
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
      endOfTripType: "another_trip",
      blockWaivers: [],
    }

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults vehicles={[vehicle]} />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("sorts vehicles by most recent operator logon time, ghosts at the top", () => {
    const oldVehicle: Vehicle = {
      id: "old",
      label: "old-label",
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
      operatorLogonTime: new Date("2018-08-15T13:30:00.000Z"),
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
      endOfTripType: "another_trip",
      blockWaivers: [],
    }
    const newVehicle: Vehicle = {
      id: "new",
      label: "new-label",
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
      operatorLogonTime: new Date("2018-08-15T13:40:00.000Z"),
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
      endOfTripType: "another_trip",
      blockWaivers: [],
    }
    const ghost: Ghost = {
      id: "ghost-trip",
      directionId: 0,
      routeId: "39",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: "ghost-run",
      viaVariant: "X",
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
    }

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults vehicles={[oldVehicle, newVehicle, ghost]} />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(JSON.stringify(tree)).toMatch(/ghost-run.*new-label.*old-label/)
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
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
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
      endOfTripType: "another_trip",
      blockWaivers: [],
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
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
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
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
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
      endOfTripType: "another_trip",
      blockWaivers: [],
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

describe("byOperatorLogonTime", () => {
  test("sorts more recent logons ahead of less recent ones", () => {
    const oldVehicle: Vehicle = {
      id: "1",
      operatorLogonTime: new Date("2018-08-15T13:30:00.000Z"),
    } as Vehicle
    const newVehicle: Vehicle = {
      id: "2",
      operatorLogonTime: new Date("2018-08-15T13:40:00.000Z"),
    } as Vehicle

    expect([oldVehicle, newVehicle].sort(byOperatorLogonTime)).toEqual([
      newVehicle,
      oldVehicle,
    ])
    expect([newVehicle, oldVehicle].sort(byOperatorLogonTime)).toEqual([
      newVehicle,
      oldVehicle,
    ])
    expect([newVehicle, newVehicle].sort(byOperatorLogonTime)).toEqual([
      newVehicle,
      newVehicle,
    ])
  })

  test("sorts ghosts ahead of vehicles", () => {
    const vehicle: Vehicle = {
      id: "1",
      operatorLogonTime: new Date("2018-08-15T13:30:00.000Z"),
    } as Vehicle
    const ghost: Vehicle = {
      id: "ghost-2",
    } as Vehicle

    expect([vehicle, ghost].sort(byOperatorLogonTime)).toEqual([ghost, vehicle])
    expect([ghost, vehicle].sort(byOperatorLogonTime)).toEqual([ghost, vehicle])
    expect([ghost, ghost].sort(byOperatorLogonTime)).toEqual([ghost, ghost])
  })
})
