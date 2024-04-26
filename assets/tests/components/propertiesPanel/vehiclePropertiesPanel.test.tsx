import { jest, describe, test, expect } from "@jest/globals"
import React, { ReactNode } from "react"
import renderer from "react-test-renderer"
import routeFactory from "../../factories/route"
import * as map from "../../../src/components/map"
import VehiclePropertiesPanel from "../../../src/components/propertiesPanel/vehiclePropertiesPanel"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import { VehiclesByRouteIdProvider } from "../../../src/contexts/vehiclesByRouteIdContext"
import { useNearestIntersection } from "../../../src/hooks/useNearestIntersection"
import { useStations } from "../../../src/hooks/useStations"
import useVehiclesForRoute from "../../../src/hooks/useVehiclesForRoute"
import {
  BlockWaiver,
  Ghost,
  Vehicle,
  VehicleInScheduledService,
} from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as dateTime from "../../../src/util/dateTime"
import vehicleFactory, { invalidVehicleFactory } from "../../factories/vehicle"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { TabMode } from "../../../src/components/propertiesPanel/tabPanels"
import userEvent from "@testing-library/user-event"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../../src/hooks/useMinischedule"
import { useTripShape } from "../../../src/hooks/useShapes"
import { fullStoryEvent } from "../../../src/helpers/fullStory"
import { closeButton } from "../../testHelpers/selectors/components/closeButton"
import { MemoryRouter } from "react-router-dom"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.spyOn(map, "MapFollowingPrimaryVehicles")

jest.mock("../../../src/hooks/useVehiclesForRoute", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => {
    return {
      is_loading: true,
    }
  }),
}))

jest.mock("../../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

jest.mock("../../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRun: jest.fn(),
  useMinischeduleBlock: jest.fn(),
}))

jest.mock("../../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(),
}))

jest.mock("../../../src/helpers/fullStory")

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

const MemoryRouterWrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
)

describe("VehiclePropertiesPanel", () => {
  test("renders a vehicle properties panel", () => {
    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={vehicle}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
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
          <VehiclePropertiesPanel
            selectedVehicle={vehicle}
            tabMode="status"
            onChangeTabMode={jest.fn()}
            onClosePanel={jest.fn()}
            openMapEnabled={true}
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
        <VehiclePropertiesPanel
          selectedVehicle={earlyVehicle}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("Includes invalid bus banner when vehicle is off course", () => {
    render(
      <VehiclePropertiesPanel
        selectedVehicle={invalidVehicleFactory.build()}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={jest.fn()}
        openMapEnabled={true}
      />,
      { wrapper: MemoryRouterWrapper }
    )
    expect(screen.getByRole("heading", { name: "Invalid Bus" })).toBeVisible()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: VehicleInScheduledService = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
    }
    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={earlyVehicle}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
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
        <VehiclePropertiesPanel
          selectedVehicle={offCourseVehicle}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a shuttle", () => {
    const shuttleVehicle: Vehicle = {
      ...vehicle,
      directionId: null,
      runId: "999-0555",
      isShuttle: true,
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={shuttleVehicle}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a vehicle with block waivers", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("1970-01-01T05:05:00.000Z"),
      endTime: new Date("1970-01-01T12:38:00.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const vehicleWithBlockWaivers: VehicleInScheduledService = {
      ...vehicle,
      blockWaivers: [blockWaiver],
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={vehicleWithBlockWaivers}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows the nearest intersection", () => {
    jest.mocked(useNearestIntersection).mockReturnValueOnce({
      ok: "Atlantic Ave & Summer St",
    })
    const result = render(
      <VehiclePropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={jest.fn()}
        openMapEnabled={true}
      />,
      { wrapper: MemoryRouterWrapper }
    )
    expect(result.getByText("Atlantic Ave & Summer St")).toBeInTheDocument()
  })

  test("renders data discrepancies when in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => "1")

    const result = render(
      <VehiclePropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={jest.fn()}
        openMapEnabled={true}
      />,
      { wrapper: MemoryRouterWrapper }
    )

    expect(result.queryAllByTestId("data-discrepancy")).toHaveLength(2)
  })

  test("does not render data discrepancies when not in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => null)

    const result = render(
      <VehiclePropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={jest.fn()}
        openMapEnabled={true}
      />,
      { wrapper: MemoryRouterWrapper }
    )

    expect(result.queryAllByTestId("data-discrepancy")).toHaveLength(0)
  })

  test("map includes other vehicles on the route", () => {
    const thisVehicle = vehicle
    const otherVehicle = { ...vehicle, id: "other" }
    const ghost = { id: "ghost" } as Ghost
    jest.spyOn(map, "MapFollowingPrimaryVehicles")
    renderer.create(
      <VehiclesByRouteIdProvider
        vehiclesByRouteId={{ "39": [thisVehicle, otherVehicle, ghost] }}
      >
        <VehiclePropertiesPanel
          selectedVehicle={thisVehicle}
          tabMode="status"
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />
      </VehiclesByRouteIdProvider>
    )
    expect(map.MapFollowingPrimaryVehicles).toHaveBeenCalledTimes(1)
    const mapArgs: map.Props = (
      map.MapFollowingPrimaryVehicles as jest.Mock<
        typeof map.MapFollowingPrimaryVehicles
      >
    ).mock.calls[0][0]
    expect(mapArgs.secondaryVehicles).toEqual([otherVehicle])
  })

  test("fetches other vehicles on the route if they don't already exist", () => {
    const thisVehicle = vehicle
    const otherVehicle = { ...vehicle, id: "other" }
    const ghost = { id: "ghost" } as Ghost
    jest.spyOn(map, "MapFollowingPrimaryVehicles")
    jest
      .mocked(useVehiclesForRoute)
      .mockImplementationOnce(() => [thisVehicle, otherVehicle, ghost])
    renderer.create(
      <VehiclePropertiesPanel
        selectedVehicle={thisVehicle}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={jest.fn()}
        openMapEnabled={true}
      />
    )
    expect(useVehiclesForRoute).toHaveBeenCalled()
    expect(map.MapFollowingPrimaryVehicles).toHaveBeenCalledTimes(1)
    const mapArgs: map.Props = (
      map.MapFollowingPrimaryVehicles as jest.Mock<
        typeof map.MapFollowingPrimaryVehicles
      >
    ).mock.calls[0][0]
    expect(mapArgs.secondaryVehicles).toEqual([otherVehicle])
  })

  test("map includes station icons", () => {
    jest.mocked(useStations).mockReturnValue([
      {
        id: "station-id",
        locationType: "station",
        name: "Station 1",
        lat: vehicle.latitude,
        lon: vehicle.longitude,
      },
    ])

    const { container } = render(
      <VehiclePropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={jest.fn()}
        openMapEnabled={true}
      />,
      { wrapper: MemoryRouterWrapper }
    )

    expect(container.innerHTML).toContain("c-station-icon")
  })

  test("calls closePanel callback on close", async () => {
    const mockClosePanel = jest.fn()

    render(
      <VehiclePropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        onChangeTabMode={jest.fn()}
        onClosePanel={mockClosePanel}
        openMapEnabled={true}
      />,
      { wrapper: MemoryRouterWrapper }
    )

    await userEvent.click(closeButton.get())

    expect(mockClosePanel).toHaveBeenCalled()
  })

  test.each<{ tab: TabMode; clickTarget: string; initialTab?: TabMode }>([
    { tab: "run", clickTarget: "Run" },
    { tab: "block", clickTarget: "Block" },
    { tab: "status", clickTarget: "Status", initialTab: "block" },
  ])(
    "when active tab changes to '$tab', calls tab change callback",
    async ({ tab, clickTarget, initialTab }) => {
      jest.mocked(useTripShape).mockReturnValue([])
      jest.mocked(useMinischeduleRun).mockReturnValue(undefined)
      jest.mocked(useMinischeduleBlock).mockReturnValue(undefined)

      const mockSetTabMode = jest.fn()

      render(
        <VehiclePropertiesPanel
          selectedVehicle={vehicleFactory.build()}
          tabMode={initialTab || "status"}
          onChangeTabMode={mockSetTabMode}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />,
        { wrapper: MemoryRouterWrapper }
      )

      await userEvent.click(screen.getByRole("tab", { name: clickTarget }))

      expect(mockSetTabMode).toHaveBeenCalledWith(tab)
    }
  )

  test.each<{ tab: TabMode; clickTarget: string; initialTab?: TabMode }>([
    { tab: "run", clickTarget: "Run" },
    { tab: "block", clickTarget: "Block" },
    { tab: "status", clickTarget: "Status", initialTab: "block" },
  ])(
    "when active tab changes to '$tab', fires fullstory event",
    async ({ tab, clickTarget, initialTab }) => {
      jest.mocked(useTripShape).mockReturnValue([])
      jest.mocked(useMinischeduleRun).mockReturnValue(undefined)
      jest.mocked(useMinischeduleBlock).mockReturnValue(undefined)

      const mockedFSEvent = jest.mocked(fullStoryEvent)

      render(
        <VehiclePropertiesPanel
          selectedVehicle={vehicleFactory.build()}
          tabMode={initialTab || "status"}
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />,
        { wrapper: MemoryRouterWrapper }
      )

      await userEvent.click(screen.getByRole("tab", { name: clickTarget }))

      expect(mockedFSEvent).toHaveBeenCalledWith(
        "Switched tab in Vehicle Properties Panel",
        { tab_str: tab }
      )
    }
  )

  test.each<{ clickTarget: string; initialTab: TabMode }>([
    { clickTarget: "Run", initialTab: "run" },
    { clickTarget: "Block", initialTab: "block" },
    { clickTarget: "Status", initialTab: "status" },
  ])(
    "when active tab '$initialTab' is clicked, does not fire fullstory event",
    async ({ clickTarget, initialTab }) => {
      jest.mocked(useTripShape).mockReturnValue([])
      jest.mocked(useMinischeduleRun).mockReturnValue(undefined)
      jest.mocked(useMinischeduleBlock).mockReturnValue(undefined)

      const mockedFSEvent = jest.mocked(fullStoryEvent)

      render(
        <VehiclePropertiesPanel
          selectedVehicle={vehicleFactory.build()}
          tabMode={initialTab}
          onChangeTabMode={jest.fn()}
          onClosePanel={jest.fn()}
          openMapEnabled={true}
        />,
        { wrapper: MemoryRouterWrapper }
      )

      await userEvent.click(screen.getByRole("tab", { name: clickTarget }))

      expect(mockedFSEvent).not.toHaveBeenCalled()
    }
  )
})
