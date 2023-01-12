import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import renderer from "react-test-renderer"
import SearchResults, {
  byOperatorLogonTime,
} from "../../src/components/searchResults"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Ghost, Vehicle } from "../../src/realtime"
import { initialState, State } from "../../src/state"
import { setSearchText } from "../../src/state/searchPageState"
import * as dateTime from "../../src/util/dateTime"

import ghostFactory from "../factories/ghost"
import vehicleFactory from "../factories/vehicle"

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
          <SearchResults
            vehicles={[]}
            onClick={jest.fn()}
            selectedVehicleId={null}
          />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a list of results including vehicles and ghosts", () => {
    const vehicle: Vehicle = vehicleFactory.build({
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
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block-1",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
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
      crowding: null,
    })
    const ghost: Ghost = ghostFactory.build({
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
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
    })

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults
            vehicles={[vehicle, ghost]}
            onClick={jest.fn()}
            selectedVehicleId={null}
          />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows the new badge for vehicle that have logged in within the past 30 minutes", () => {
    const vehicle: Vehicle = vehicleFactory.build({
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
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T17:40:21.000Z"),
      bearing: 33,
      blockId: "block-1",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
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
      crowding: null,
    })

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults
            vehicles={[vehicle]}
            onClick={jest.fn()}
            selectedVehicleId={null}
          />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("sorts vehicles by most recent operator logon time, ghosts at the top", () => {
    const oldVehicle: Vehicle = vehicleFactory.build({
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
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:30:00.000Z"),
      bearing: 33,
      blockId: "block-1",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
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
      crowding: null,
    })
    const newVehicle: Vehicle = vehicleFactory.build({
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
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:40:00.000Z"),
      bearing: 33,
      blockId: "block-1",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
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
      crowding: null,
    })
    const ghost: Ghost = ghostFactory.build({
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
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
    })

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults
            vehicles={[oldVehicle, newVehicle, ghost]}
            onClick={jest.fn()}
            selectedVehicleId={null}
          />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(JSON.stringify(tree)).toMatch(/ghost-run.*new-label.*old-label/)
  })

  test("renders a selected result card", () => {
    const vehicle: Vehicle = vehicleFactory.build({
      runId: "run-1",
      label: "v1-label",
      operatorId: "op1",
    })
    const ghost: Ghost = ghostFactory.build({ runId: "123-0123" })

    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <SearchResults
            vehicles={[vehicle, ghost]}
            onClick={jest.fn()}
            selectedVehicleId={vehicle.id}
          />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a result card selects that vehicle", async () => {
    const testDispatch = jest.fn()
    const vehicle: Vehicle = vehicleFactory.build({ runId: "12345" })
    const mockOnClick = jest.fn()
    render(
      <StateDispatchProvider state={state} dispatch={testDispatch}>
        <SearchResults
          vehicles={[vehicle]}
          onClick={mockOnClick}
          selectedVehicleId={null}
        />
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("cell", { name: /run/i }))

    expect(mockOnClick).toHaveBeenCalledWith(vehicle)
  })

  test("clicking the clear search button empties the search text", async () => {
    const testDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={state} dispatch={testDispatch}>
        <SearchResults
          vehicles={[]}
          onClick={jest.fn()}
          selectedVehicleId={null}
        />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText("Clear search"))
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
