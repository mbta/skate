import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import App, { AppRoutes } from "../../src/components/app"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { SocketProvider } from "../../src/contexts/socketContext"
import useDataStatus from "../../src/hooks/useDataStatus"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import { initialState } from "../../src/state"
import routeTabFactory from "../factories/routeTab"
import useVehicles from "../../src/hooks/useVehicles"
import vehicleFactory from "../factories/vehicle"
import { MemoryRouter } from "react-router-dom"
import { vehiclePropertiesPanelHeader } from "../testHelpers/selectors/components/vehiclePropertiesPanel"
import stateFactory from "../factories/applicationState"
import { OpenView, PagePath } from "../../src/state/pagePanelState"
import { viewFactory } from "../factories/pagePanelStateFactory"
import userEvent from "@testing-library/user-event"
import { mockUsePanelState } from "../testHelpers/usePanelStateMocks"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"

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

jest.mock("../../src/hooks/usePanelState")

beforeEach(() => {
  mockUsePanelState()
})

describe("App", () => {
  test("renders", () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.KeycloakSso])
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
    jest.mocked(useDataStatus).mockReturnValueOnce("outage")
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

    expect(jest.mocked(useVehicles)).toHaveBeenCalledWith(undefined, [
      "1",
      "15",
      "22",
    ])
  })

  describe("renders all views on the expected pages", () => {
    const vehicle = vehicleFactory.build()
    const mockDispatch = jest.fn()

    const pagesWithRightPanel = ["/", "/map", "/shuttle-map", "/settings"]

    describe.each(pagesWithRightPanel)("All views render on %s", (path) => {
      beforeAll(() => {
        jest.mocked(useVehicles).mockReturnValue({
          [vehicle.routeId!]: [vehicle],
        })
      })

      afterAll(() => {
        jest.mocked(useVehicles).mockReset()
      })

      test("VPP", async () => {
        mockUsePanelState({
          currentView: {
            selectedVehicleOrGhost: vehicle,
            vppTabMode: "status",
            openView: OpenView.None,
            previousView: OpenView.None,
          },
        })

        render(
          <StateDispatchProvider
            state={stateFactory.build({
              view: viewFactory
                .currentState({
                  selectedVehicleOrGhost: vehicle,
                })
                .build(),
            })}
            dispatch={mockDispatch}
          >
            <MemoryRouter initialEntries={[path]}>
              <AppRoutes />
            </MemoryRouter>
          </StateDispatchProvider>
        )

        expect(await vehiclePropertiesPanelHeader.find()).toBeInTheDocument()
      })

      test.each([
        ["Late View", OpenView.Late],
        ["Swings", OpenView.Swings],
        ["Notifications", OpenView.NotificationDrawer],
      ])("%s", (expectedPanelTitle, openView) => {
        mockUsePanelState({
          currentView: {
            selectedVehicleOrGhost: undefined,
            vppTabMode: undefined,
            openView,
            previousView: OpenView.None,
          },
        })
        render(
          <StateDispatchProvider
            state={stateFactory.build({
              view: viewFactory
                .currentState({
                  openView,
                })
                .build(),
            })}
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

  test("renders search map page", async () => {
    render(
      <MemoryRouter initialEntries={["/map"]}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(
      await screen.findByRole("generic", { name: /search map page/i })
    ).toBeInTheDocument()
  })

  test("updates panel state when page changes", async () => {
    const mockedUsePanelState = mockUsePanelState()
    const path = PagePath.Shuttles

    render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("link", { name: "Shuttle Map" }))

    expect(mockedUsePanelState().setPath).toHaveBeenNthCalledWith(1, "/")
    expect(mockedUsePanelState().setPath).toHaveBeenNthCalledWith(2, path)
  })
})
