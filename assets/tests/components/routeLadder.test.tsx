import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import RouteLadder from "../../src/components/routeLadder"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { LadderCrowdingToggles } from "../../src/models/ladderCrowdingToggle"
import {
  Ghost,
  RouteStatus,
  VehicleInScheduledService,
} from "../../src/realtime.d"
import { Route } from "../../src/schedule.d"
import { initialState } from "../../src/state"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import routeFactory from "../factories/route"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import { routeAlert } from "../testHelpers/selectors/components/routeLadder"
import { mockUsePanelState } from "../testHelpers/usePanelStateMocks"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"

jest.mock("../../src/hooks/usePanelState")

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

beforeEach(() => {
  mockUsePanelState()
  jest.mocked(getTestGroups).mockReturnValue([])
})

const vehicles: VehicleInScheduledService[] = [
  vehicleFactory.build({
    id: "y1818",
    label: "1818",
    runId: "run-1",
    timestamp: 1557160307,
    latitude: 0,
    longitude: 0,
    directionId: 0,
    routeId: "28",
    tripId: "39914237",
    operatorId: "op1",
    operatorFirstName: "PATTI",
    operatorLastName: "SMITH",
    operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
    bearing: 33,
    blockId: "block-1",
    headsign: "h1",
    viaVariant: "4",
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
  }),
  vehicleFactory.build({
    id: "y0479",
    label: "0479",
    runId: "run-2",
    timestamp: 1557160347,
    latitude: 0,
    longitude: 0,
    directionId: 1,
    routeId: "28",
    tripId: "39914128",
    operatorId: "op2",
    operatorFirstName: "NORA",
    operatorLastName: "JONES",
    operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
    bearing: 33,
    blockId: "block-1",
    headsign: null,
    viaVariant: null,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    isShuttle: false,
    isOverload: false,
    isOffCourse: false,
    isRevenue: true,
    layoverDepartureTime: null,
    dataDiscrepancies: [],
    stopStatus: {
      stopId: "59",
      stopName: "59",
    },
    timepointStatus: {
      fractionUntilTimepoint: 0.0,
      timepointId: "MORTN",
    },
    scheduledLocation: {
      routeId: "28",
      directionId: 1,
      tripId: "scheduled trip",
      runId: "scheduled run",
      timeSinceTripStartTime: 0,
      headsign: "scheduled headsign",
      viaVariant: "scheduled via variant",
      timepointStatus: {
        timepointId: "MORTN",
        fractionUntilTimepoint: 0.0,
      },
    },
    routeStatus: "on_route",
    endOfTripType: "another_trip",
    blockWaivers: [],
    crowding: null,
  }),
]

jest.unmock("@tippyjs/react")

describe("routeLadder", () => {
  const originalGetBBox = SVGSVGElement.prototype.getBBox
  const originalGetElementsByClassName = document.getElementsByClassName

  beforeEach(() => {
    SVGSVGElement.prototype.getBBox = () => {
      return {
        height: 100,
        width: 50,
      } as DOMRect
    }
    const mockElement = {
      offsetHeight: 120,
    }
    // @ts-ignore
    document.getElementsByClassName = () => [mockElement]
  })

  afterEach(() => {
    SVGSVGElement.prototype.getBBox = originalGetBBox
    document.getElementsByClassName = originalGetElementsByClassName
  })

  test("renders a route ladder", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const tree = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    ).container

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with the new header format", () => {
    jest
      .mocked(getTestGroups)
      .mockReturnValue([TestGroups.RouteLadderHeaderUpdate])

    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const { container: tree } = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with the new header and detour dropdown", () => {
    jest
      .mocked(getTestGroups)
      .mockReturnValue([
        TestGroups.RouteLadderHeaderUpdate,
        TestGroups.DetoursPilot,
      ])

    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const { container: tree } = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with vehicles", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const ghost: Ghost = ghostFactory.build({
      id: "ghost-trip",
      directionId: 0,
      routeId: route.id,
      tripId: "ghost trip",
      headsign: "headsign",
      blockId: "ghost block",
      runId: "123-0123",
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "MORTN",
        fractionUntilTimepoint: 0.0,
      },
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
    })

    const tree = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={(
          vehicles as (VehicleInScheduledService | Ghost)[]
        ).concat([ghost])}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with vehicles in the incoming box", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]
    const tree = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={vehicles.map(
          (vehicle: VehicleInScheduledService) => ({
            ...vehicle,
            routeStatus: "pulling_out" as RouteStatus,
          })
        )}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with laying over vehicles", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })

    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const [v1, v2] = vehicles
    const tree = render(
      <RouteLadder
        route={route}
        selectedVehicleId={undefined}
        timepoints={timepoints}
        vehiclesAndGhosts={[
          { ...v1, routeStatus: "laying_over" },
          { ...v2, routeStatus: "laying_over" },
        ]}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with crowding instead of vehicles", () => {
    const ladderCrowdingToggles: LadderCrowdingToggles = { "28": true }
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })

    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const [v1, v2] = vehicles
    const tree = render(
      <RouteLadder
        route={route}
        selectedVehicleId={undefined}
        timepoints={timepoints}
        vehiclesAndGhosts={[
          {
            ...v1,
            crowding: {
              occupancyStatus: "FEW_SEATS_AVAILABLE",
              occupancyPercentage: 0.78,
              load: 14,
              capacity: 18,
            },
          },
          {
            ...v2,
            crowding: null,
          },
        ]}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={ladderCrowdingToggles}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("doesn't render a bus that's off-course but nonrevenue", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })

    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const [v1, v2] = vehicles
    const tree = render(
      <RouteLadder
        route={route}
        selectedVehicleId={undefined}
        timepoints={timepoints}
        vehiclesAndGhosts={[
          {
            ...v1,
          },
          {
            ...v2,
            isOffCourse: true,
            isRevenue: false,
          },
        ]}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("displays no crowding data for a bus coming off a route with no crowding data onto a route with crowding data", () => {
    const ladderCrowdingToggles: LadderCrowdingToggles = { "28": true }
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })

    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const [v1, v2] = vehicles
    const tree = render(
      <RouteLadder
        route={route}
        selectedVehicleId={undefined}
        timepoints={timepoints}
        vehiclesAndGhosts={[
          {
            ...v1,
            crowding: {
              occupancyStatus: "FEW_SEATS_AVAILABLE",
              occupancyPercentage: 0.78,
              load: 14,
              capacity: 18,
            },
          },
          {
            ...v2,
            routeId: "741",
            crowding: null,
          },
        ]}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={ladderCrowdingToggles}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("doesn't display crowding data for a vehicle coming off a route with crowding data onto a route with none", () => {
    const ladderCrowdingToggles: LadderCrowdingToggles = { "28": true }
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })

    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const [v1, v2] = vehicles
    const tree = render(
      <RouteLadder
        route={route}
        selectedVehicleId={undefined}
        timepoints={timepoints}
        vehiclesAndGhosts={[
          {
            ...v1,
            crowding: null,
          },
          {
            ...v2,
            routeId: "741",
            crowding: {
              occupancyStatus: "FEW_SEATS_AVAILABLE",
              occupancyPercentage: 0.78,
              load: 14,
              capacity: 18,
            },
          },
        ]}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={ladderCrowdingToggles}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("displays loading if we are fetching the timepoints", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = null

    const tree = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    ).asFragment()

    expect(tree).toMatchSnapshot()
  })

  test("renders alert icon on a route ladder with an active detour", () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={true}
      />
    )

    expect(routeAlert.get()).toBeVisible()
  })

  test("clicking alert icon should show tooltip and observe event", async () => {
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={true}
      />
    )

    await userEvent.click(routeAlert.get())

    expect(routeAlert.get()).toHaveAccessibleDescription(/Active Detour/i)
    expect(tagManagerEvent).toHaveBeenCalledWith("alert_tooltip_clicked")
  })

  test("clicking the close button deselects that route", async () => {
    const mockDeselect = jest.fn()
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const user = userEvent.setup()
    const result = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={mockDeselect}
        reverseLadder={() => {}}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    )
    await user.click(result.getByRole("button", { name: /close/i }))

    expect(mockDeselect).toHaveBeenCalledWith("28")
  })

  test("clicking the reverse button reverses the order of the timepoints", async () => {
    const mockReverse = jest.fn()
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const result = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={mockReverse}
        toggleCrowding={() => {}}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    )
    await userEvent.click(result.getByRole("button", { name: /Reverse/ }))

    expect(mockReverse).toHaveBeenCalledWith("28")
  })

  test("clicking the crowding toggle toggles crowding", async () => {
    const mockToggle = jest.fn()
    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]

    const [v1] = vehicles

    const result = render(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={[
          {
            ...v1,
            crowding: {
              occupancyStatus: "EMPTY",
              load: 0,
              capacity: 18,
              occupancyPercentage: 0,
            },
          },
        ]}
        selectedVehicleId={undefined}
        deselectRoute={() => {}}
        reverseLadder={() => {}}
        toggleCrowding={mockToggle}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        hasAlert={false}
      />
    )
    await userEvent.click(result.getByRole("button", { name: /Show riders/ }))

    expect(mockToggle).toHaveBeenCalledWith("28")
  })

  test("clicking an incoming vehicle selects that vehicle", async () => {
    const mockedUsePanelState = mockUsePanelState()

    const route: Route = routeFactory.build({
      id: "28",
      name: "28",
    })
    const timepoints = [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ]
    const vehicle: VehicleInScheduledService = vehicleFactory.build({
      id: "v1",
      label: "v1",
      runId: "run1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      directionId: 1,
      routeId: "28",
      tripId: "trip",
      headsign: null,
      viaVariant: null,
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
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        timepointId: "MATPN",
        fractionUntilTimepoint: 0.5,
      },
      scheduledLocation: null,
      routeStatus: "pulling_out",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: null,
    })

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={[vehicle]}
          selectedVehicleId={undefined}
          deselectRoute={() => {}}
          reverseLadder={() => {}}
          toggleCrowding={() => {}}
          ladderDirections={{}}
          ladderCrowdingToggles={{}}
          hasAlert={false}
        />
      </StateDispatchProvider>
    )
    await userEvent.click(result.getByText("run1"))

    expect(
      mockedUsePanelState().openVehiclePropertiesPanel
    ).toHaveBeenCalledWith(vehicle)
  })
})
