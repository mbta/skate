import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import App, { AppRoutes } from "../../src/components/app"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { SocketProvider } from "../../src/contexts/socketContext"
import useDataStatus from "../../src/hooks/useDataStatus"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import { initialState, OpenView } from "../../src/state"
import routeTabFactory from "../factories/routeTab"
import useVehicles from "../../src/hooks/useVehicles"
import vehicleFactory from "../factories/vehicle"
import { TestGroups } from "../../src/userInTestGroup"
import getTestGroups from "../../src/userTestGroups"
import { MemoryRouter } from "react-router-dom"
import { vehiclePropertiesPanelHeader } from "../testHelpers/selectors/components/vehiclePropertiesPanel"

jest.mock("../../src/hooks/useDataStatus", () => ({
  __esModule: true,
  default: jest.fn(() => "good"),
}))
jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("App", () => {
  test("renders", () => {
    const result = render(<App />)
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("shows disconnected modal if the socket is disconnected", () => {
    const result = render(
      <SocketProvider
        socketStatus={{
          socket: undefined,
          connectionStatus: ConnectionStatus.Disconnected,
        }}
      >
        <App />
      </SocketProvider>
    )
    expect(
      result.queryByText(/Your connection to Skate has expired./)
    ).toBeVisible()
  })

  test("shows data outage banner if there's a data outage", () => {
    ;(useDataStatus as jest.Mock).mockReturnValueOnce("outage")
    const result = render(<App />)
    expect(result.queryByText(/Ongoing MBTA Data Outage/)).toBeVisible()
  })

  test("pulls in vehicles / ghosts for routes in all open tabs", () => {
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          selectedRouteIds: ["1", "15"],
          isCurrentTab: true,
        }),
        routeTabFactory.build({ ordering: 1, selectedRouteIds: ["15", "22"] }),
      ],
    }
    const mockDispatch = jest.fn()
    render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <App />
      </StateDispatchProvider>
    )

    const routeIds = (useVehicles as jest.Mock).mock.calls[0][1]

    expect(routeIds).toEqual(["1", "15", "22"])
  })

  describe("renders all views on the expected pages", () => {
    const vehicle = vehicleFactory.build()
    const mockDispatch = jest.fn()

    const pagesWithRightPanel = ["/", "/search", "/shuttle-map", "/settings"]

    describe.each(pagesWithRightPanel)("All views render on %s", (path) => {
      beforeAll(() => {
        ;(useVehicles as jest.Mock).mockReturnValue({
          [vehicle.routeId!]: [vehicle],
        })
      })

      afterAll(() => {
        ;(useVehicles as jest.Mock).mockReset()
      })

      test("VPP ", () => {
        render(
          <StateDispatchProvider
            state={{
              ...initialState,
              selectedVehicleOrGhost: vehicle,
            }}
            dispatch={mockDispatch}
          >
            <MemoryRouter initialEntries={[path]}>
              <AppRoutes />
            </MemoryRouter>
          </StateDispatchProvider>
        )
        expect(vehiclePropertiesPanelHeader.get()).toBeInTheDocument()
      })
      test.each([
        ["Late View", OpenView.Late],
        ["Swings", OpenView.Swings],
        ["Notifications", OpenView.NotificationDrawer],
      ])("%s", (expectedPanelTitle, openView) => {
        render(
          <StateDispatchProvider
            state={{ ...initialState, openView: openView }}
            dispatch={mockDispatch}
          >
            <App />
          </StateDispatchProvider>
        )
        expect(
          screen.getByRole("heading", { name: expectedPanelTitle })
        ).toBeInTheDocument()
      })
    })
  })

  test("renders old search page for users not in map test group", () => {
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(
      screen.queryByRole("generic", { name: /search map page/i })
    ).not.toBeInTheDocument()
  })

  test("renders new map page for users in map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([TestGroups.MapBeta])

    render(
      <MemoryRouter initialEntries={["/map"]}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(
      screen.getByRole("generic", { name: /search map page/i })
    ).toBeInTheDocument()
  })
})
