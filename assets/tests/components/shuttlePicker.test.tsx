import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import ShuttlePicker, {
  activeRunCounts,
  formatRunId,
} from "../../src/components/shuttlePicker"
import { ShuttleVehiclesProvider } from "../../src/contexts/shuttleVehiclesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { RunId, Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import {
  deselectAllShuttleRuns,
  deselectShuttleRoute,
  deselectShuttleRun,
  initialState,
  selectAllShuttleRuns,
  selectShuttleRoute,
  selectShuttleRun,
} from "../../src/state"

const vehicle: Vehicle = {
  id: "y1818",
  label: "1818",
  runId: "999-0555",
  timestamp: 1557160307,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "1",
  tripId: "39914237",
  headsign: "h1",
  viaVariant: "4",
  operatorId: "op1",
  operatorName: "SMITH",
  bearing: 33,
  speed: 50.0,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  isLayingOver: false,
  layoverDepartureTime: null,
  blockIsActive: true,
  dataDiscrepancies: [],
  stopStatus: {
    status: "in_transit_to",
    stopId: "57",
    stopName: "57",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "MATPN",
  },
  scheduledLocation: null,
  isOnRoute: true,
}

const shuttleRoutes: Route[] = [
  {
    id: "Shuttle-AshmontMattapan",
    directionNames: { "0": "Outbound", "1": "Inbound" },
    name: "Mattapan Line Shuttle",
  },
  {
    id: "Shuttle-BabcockBostonCollege",
    directionNames: { "0": "West", "1": "East" },
    name: "Green Line B Shuttle",
  },
  {
    id: "Shuttle-BallardvaleMaldenCenter",
    directionNames: { "0": "Outbound", "1": "Inbound" },
    name: "Haverhill Line Shuttle",
  },
]

jest.mock("../../src/hooks/useShuttleRoutes", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => shuttleRoutes),
}))

describe("ShuttlePicker", () => {
  test("renders loading state", () => {
    const tree = renderer.create(
      <ShuttleVehiclesProvider shuttles={null}>
        <ShuttlePicker />
      </ShuttleVehiclesProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders loaded state with no shuttles", () => {
    const tree = renderer.create(
      <ShuttleVehiclesProvider shuttles={[]}>
        <ShuttlePicker />
      </ShuttleVehiclesProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders", () => {
    /*
    999-0501: known, no active shuttles, unselected
    999-0502: known, no active shuttles, selected
    999-0503: known, active shuttles, unselected
    999-0504: known, active shuttles, selected
    999-0511: unknown, unselected
    999-0512: unknown, selected
    */
    const selectedShuttleRunIds: RunId[] = ["999-0502", "999-0504", "999-0512"]
    const shuttles: Vehicle[] = [
      { ...vehicle, runId: "999-0503" },
      { ...vehicle, runId: "999-0504" },
      { ...vehicle, runId: "999-0511" },
      { ...vehicle, runId: "999-0512" },
    ]
    const tree = renderer.create(
      <StateDispatchProvider
        state={{
          ...initialState,
          selectedShuttleRunIds,
        }}
        dispatch={jest.fn()}
      >
        <ShuttleVehiclesProvider shuttles={shuttles}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )

    expect(tree).toMatchSnapshot()
  })

  test("clicking an unselected run id adds it to selected run ids", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <ShuttleVehiclesProvider shuttles={[vehicle]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    wrapper
      .find(
        ".m-route-picker__shuttle-run-list .m-route-picker__route-list-button--unselected"
      )
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(selectShuttleRun(vehicle.runId!))
  })

  test("clicking a selected run id removes it from selected run ids", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [vehicle.runId!] }}
        dispatch={dispatch}
      >
        <ShuttleVehiclesProvider shuttles={[vehicle]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    wrapper
      .find(
        ".m-route-picker__shuttle-run-list .m-route-picker__route-list-button--selected"
      )
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(deselectShuttleRun(vehicle.runId!))
  })

  test("clicking the unselected All Specials button selects all runs", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [] }}
        dispatch={dispatch}
      >
        <ShuttleVehiclesProvider shuttles={[vehicle]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    const allSpecialsButton = wrapper
      .find(
        ".m-route-picker__shuttle-run-list .m-route-picker__route-list-button"
      )
      .first()

    expect(allSpecialsButton.text().includes("All Specials")).toBeTruthy()

    allSpecialsButton.simulate("click")

    expect(dispatch).toHaveBeenCalledWith(selectAllShuttleRuns())
  })

  test("clicking the selected All Specials button deselects all runs", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: "all" }}
        dispatch={dispatch}
      >
        <ShuttleVehiclesProvider shuttles={[vehicle]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    const allSpecialsButton = wrapper
      .find(
        ".m-route-picker__shuttle-run-list .m-route-picker__route-list-button"
      )
      .first()

    expect(allSpecialsButton.text().includes("All Specials")).toBeTruthy()

    allSpecialsButton.simulate("click")

    expect(dispatch).toHaveBeenCalledWith(deselectAllShuttleRuns())
  })

  test("clicking an unselected route button adds the route to the selected route IDs", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <ShuttleVehiclesProvider shuttles={[]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    wrapper
      .find(
        ".m-route-picker__shuttle-route-list .m-route-picker__route-list-button--unselected"
      )
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(
      selectShuttleRoute(shuttleRoutes[0].id)
    )
  })

  test("clicking a selected route button removes the route from the selected route IDs", () => {
    const selectedRouteId = shuttleRoutes[1].id
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRouteIds: [selectedRouteId] }}
        dispatch={dispatch}
      >
        <ShuttleVehiclesProvider shuttles={[]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    wrapper
      .find(
        ".m-route-picker__shuttle-route-list .m-route-picker__route-list-button--selected"
      )
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(deselectShuttleRoute(selectedRouteId))
  })
})

describe("activeRunCounts", () => {
  test("returns vehicle per shuttle run, plus 'all'", () => {
    const shuttles = [
      {
        id: "1",
        runId: "1",
      },
      {
        id: "2",
        runId: "2",
      },
      {
        id: "3",
        runId: "1",
      },
    ] as Vehicle[]

    const expected = {
      "1": 2,
      "2": 1,
      all: 3,
    }

    expect(activeRunCounts(shuttles)).toEqual(expected)
  })

  test("ignores vehicles with no runId", () => {
    const shuttles = [
      {
        id: "1",
        runId: "1",
      },
      {
        id: "2",
        runId: null,
      },
    ] as Vehicle[]

    const expected = {
      "1": 1,
      all: 1,
    }

    expect(activeRunCounts(shuttles)).toEqual(expected)
  })
})

describe("formatRunId", () => {
  test("removes -", () => {
    expect(formatRunId("999-1234")).toEqual("999 1234")
  })

  test("removes leading 0s", () => {
    expect(formatRunId("999-0550")).toEqual("999 550")
  })
})
