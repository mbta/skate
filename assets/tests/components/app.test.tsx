import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import App from "../../src/components/app"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { SocketProvider } from "../../src/contexts/socketContext"
import useDataStatus from "../../src/hooks/useDataStatus"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import { initialState, State } from "../../src/state"
import routeTabFactory from "../factories/routeTab"
import useVehicles from "../../src/hooks/useVehicles"
import vehicle from "../factories/vehicle"
import { MAP_BETA_GROUP_NAME } from "../../src/userInTestGroup"
import getTestGroups from "../../src/userTestGroups"

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
    ;(useDataStatus as jest.Mock).mockImplementationOnce(() => "outage")
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

  describe("renders VPP  on the expected pages", () => {
    const mockState: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle.build({ routeId: null }),
    }
    const mockDispatch = jest.fn()

    test.each([["/"], ["/search"], ["/shuttle-map"], ["/settings"]])(
      "VPP renders on %s",
      (path) => {
        window.history.pushState({}, "", path)
        render(
          <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
            <App />
          </StateDispatchProvider>
        )
        expect(screen.getByText("Vehicles")).toBeInTheDocument()
      }
    )
  })

  test("does not display VPP over map page", () => {
    const mockState: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle.build({ routeId: null }),
    }
    const mockDispatch = jest.fn()
    window.history.pushState({}, "", "/map")
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([MAP_BETA_GROUP_NAME])

    render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <App />
      </StateDispatchProvider>
    )
    expect(screen.queryByText("Vehicles")).not.toBeInTheDocument()
  })

  test("renders old search page for users not in map test group", () => {
    window.history.pushState({}, "", "/search")

    render(<App />)

    expect(screen.queryByTestId("map-page")).not.toBeInTheDocument()
  })

  test("renders new map page for users in map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([MAP_BETA_GROUP_NAME])
    window.history.pushState({}, "", "/map")

    render(<App />)

    expect(screen.getByTestId("map-page")).toBeInTheDocument()
  })
})
