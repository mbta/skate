import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import Header from "../../../src/components/propertiesPanel/header"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import {
  emptyLadderDirectionsByRouteId,
  flipLadderDirectionForRoute,
  LadderDirections,
} from "../../../src/models/ladderDirection"
import {
  Ghost,
  Vehicle,
  VehicleInScheduledService,
} from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import { initialState } from "../../../src/state"
import vehicleFactory from "../../factories/vehicle"
import ghostFactory from "../../factories/ghost"
import routeFactory from "../../factories/route"
import routeTabFactory from "../../factories/routeTab"
import userEvent from "@testing-library/user-event"

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const setTabMode = jest.fn()

const vehicle: VehicleInScheduledService = vehicleFactory.build({
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

describe("Header", () => {
  test("renders a header", () => {
    const tree = renderer
      .create(
        <Header
          vehicle={vehicle}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with route data", () => {
    const route: Route = routeFactory.build({
      id: "39",
      name: "39",
    })
    const tree = renderer
      .create(
        <RoutesProvider routes={[route]}>
          <Header
            vehicle={vehicle}
            tabMode={"status"}
            onChangeTabMode={setTabMode}
            onClosePanel={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an early vehicle", () => {
    const earlyVehicle: VehicleInScheduledService = {
      ...vehicle,
      scheduleAdherenceSecs: -61,
    }
    const tree = renderer
      .create(
        <Header
          vehicle={earlyVehicle}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: VehicleInScheduledService = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
    }
    const tree = renderer
      .create(
        <Header
          vehicle={earlyVehicle}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an off-course vehicle", () => {
    const offCourseVehicle: VehicleInScheduledService = {
      ...vehicle,
      isOffCourse: true,
    }

    const tree = renderer
      .create(
        <Header
          vehicle={offCourseVehicle}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a shuttle", () => {
    const shuttleVehicle: VehicleInScheduledService = {
      ...vehicle,
      isShuttle: true,
    }

    const tree = renderer
      .create(
        <Header
          vehicle={shuttleVehicle}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a ghost", () => {
    const ghost: Ghost = ghostFactory.build({
      id: "ghost-trip",
      directionId: 0,
      routeId: "39",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
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
        <Header
          vehicle={ghost}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders pointing right for a laying over vehicle", () => {
    const result = render(
      <Header
        vehicle={{ ...vehicle, directionId: 0, routeStatus: "laying_over" }}
        tabMode={"status"}
        onChangeTabMode={setTabMode}
        onClosePanel={jest.fn()}
      />
    )
    expect(result.getByTestId("vehicle-triangle")).toHaveAttribute(
      "transform",
      expect.stringContaining("rotate(90)")
    )
  })

  test("renders pointing left for a laying over vehicle", () => {
    const result = render(
      <Header
        vehicle={{ ...vehicle, directionId: 1, routeStatus: "laying_over" }}
        tabMode={"status"}
        onChangeTabMode={setTabMode}
        onClosePanel={jest.fn()}
      />
    )

    expect(result.getByTestId("vehicle-triangle")).toHaveAttribute(
      "transform",
      expect.stringContaining("rotate(270)")
    )
  })

  test("renders a vehicle that's moving down on the ladder as pointing down", () => {
    const ladderDirections: LadderDirections = flipLadderDirectionForRoute(
      emptyLadderDirectionsByRouteId,
      vehicle.routeId!
    )

    const result = render(
      <StateDispatchProvider
        state={{
          ...initialState,
          routeTabs: [
            routeTabFactory.build({ isCurrentTab: true, ladderDirections }),
          ],
        }}
        dispatch={jest.fn()}
      >
        <Header
          vehicle={vehicle}
          tabMode={"status"}
          onChangeTabMode={setTabMode}
          onClosePanel={jest.fn()}
        />
      </StateDispatchProvider>
    )

    expect(result.getByTestId("vehicle-triangle")).toHaveAttribute(
      "transform",
      expect.stringContaining("rotate(180)")
    )
  })

  test("renders a shuttle triangle as pointing up", () => {
    const shuttleVehicle: Vehicle = {
      ...vehicle,
      runId: "999-0555",
      routeId: null,
      tripId: null,
    }
    const result = render(
      <Header
        vehicle={shuttleVehicle}
        tabMode={"status"}
        onChangeTabMode={setTabMode}
        onClosePanel={jest.fn()}
      />
    )

    expect(result.getByTestId("vehicle-triangle")).toHaveAttribute(
      "transform",
      expect.stringContaining("rotate(0)")
    )
  })

  test("clicking the X close button deselects the vehicle", async () => {
    const mockClosePanel = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <Header
        vehicle={vehicle}
        tabMode={"status"}
        onChangeTabMode={setTabMode}
        onClosePanel={mockClosePanel}
      />
    )

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(mockClosePanel).toHaveBeenCalled()
  })
})
