import React from "react"
import { render } from "@testing-library/react"
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
import appData from "../../src/appData"
import { MAP_BETA_GROUP_NAME } from "../../src/userTestGroups"

jest.mock("../../src/hooks/useDataStatus", () => ({
  __esModule: true,
  default: jest.fn(() => "good"),
}))
jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("appData")

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
    ;(useDataStatus as jest.Mock).mockImplementation(() => "outage")
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

  test("renders VPP when vehicle is selected", () => {
    const mockState: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle.build({ routeId: null }),
    }
    const mockDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <App />
      </StateDispatchProvider>
    )

    expect(result.getByText("Vehicles")).toBeInTheDocument()
  })

  test("renders old search page for users not in map test group", () => {
    window.history.pushState({}, "", "/search")

    const result = render(<App />)

    expect(result.queryByTestId("map-page")).not.toBeInTheDocument()
  })

  test("renders new map page for users in map test group", () => {
    ;(appData as jest.Mock).mockImplementationOnce(() => ({
      userTestGroups: JSON.stringify([MAP_BETA_GROUP_NAME]),
    }))
    window.history.pushState({}, "", "/map")

    const result = render(<App />)

    expect(result.getByTestId("map-page")).toBeInTheDocument()
  })
})
