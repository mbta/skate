import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import ShuttlePicker, {
  activeRunCounts,
  formatRunId,
} from "../../src/components/shuttlePicker"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
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
import vehicleFactory from "../factories/vehicle"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const vehicle: Vehicle = vehicleFactory.build({
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
  dataDiscrepancies: [],
  stopStatus: {
    stopId: "57",
    stopName: "57",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "MATPN",
  },
  scheduledLocation: null,
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
  crowding: null,
})

const shuttleRoutes: Route[] = [
  routeFactory.build({
    id: "Shuttle-AshmontMattapan",
    name: "Mattapan Line Shuttle",
  }),
  routeFactory.build({
    id: "Shuttle-BabcockBostonCollege",
    name: "Green Line B Shuttle",
  }),
  routeFactory.build({
    id: "Shuttle-BallardvaleMaldenCenter",
    name: "Haverhill Line Shuttle",
  }),
]

jest.mock("../../src/hooks/useShuttleRoutes", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => shuttleRoutes),
}))

describe("ShuttlePicker", () => {
  test("renders loading state", () => {
    const tree = renderer.create(<ShuttlePicker shuttles={null} />)
    expect(tree).toMatchSnapshot()
  })

  test("renders loaded state with no shuttles", () => {
    const tree = renderer.create(<ShuttlePicker shuttles={[]} />)
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
        <ShuttlePicker shuttles={shuttles} />
      </StateDispatchProvider>
    )

    expect(tree).toMatchSnapshot()
  })

  test("clicking an unselected run id adds it to selected run ids", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <ShuttlePicker shuttles={[vehicle]} />
      </StateDispatchProvider>
    )
    await userEvent.click(
      result.getByRole("button", { name: /Special 999 555/ })
    )

    expect(dispatch).toHaveBeenCalledWith(selectShuttleRun(vehicle.runId!))
  })

  test("clicking a selected run id removes it from selected run ids", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [vehicle.runId!] }}
        dispatch={dispatch}
      >
        <ShuttlePicker shuttles={[vehicle]} />
      </StateDispatchProvider>
    )

    await userEvent.click(
      result.getByRole("button", { name: /Special 999 555/ })
    )

    expect(dispatch).toHaveBeenCalledWith(deselectShuttleRun(vehicle.runId!))
  })

  test("clicking the unselected All Specials button selects all runs", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [] }}
        dispatch={dispatch}
      >
        <ShuttlePicker shuttles={[vehicle]} />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: /All Specials/ }))

    expect(dispatch).toHaveBeenCalledWith(selectAllShuttleRuns())
  })

  test("clicking the selected All Specials button deselects all runs", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: "all" }}
        dispatch={dispatch}
      >
        <ShuttlePicker shuttles={[vehicle]} />
      </StateDispatchProvider>
    )
    await userEvent.click(result.getByRole("button", { name: /All Specials/ }))

    expect(dispatch).toHaveBeenCalledWith(deselectAllShuttleRuns())
  })

  test("clicking an unselected route button adds the route to the selected route IDs", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <ShuttlePicker shuttles={[]} />
      </StateDispatchProvider>
    )
    await userEvent.click(result.getByRole("button", { name: /Blue Line/ }))

    expect(dispatch).toHaveBeenCalledWith(selectShuttleRoute("Blue"))
  })

  test("clicking a selected route button removes the route from the selected route IDs", async () => {
    const selectedRoute = shuttleRoutes[1]
    const selectedRouteId = selectedRoute.id
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRouteIds: [selectedRouteId] }}
        dispatch={dispatch}
      >
        <ShuttlePicker shuttles={[]} />
      </StateDispatchProvider>
    )
    await userEvent.click(
      result.getByRole("button", { name: selectedRoute.name })
    )

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
