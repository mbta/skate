import { mount } from "enzyme"
import React from "react"
import RightPanel, {
  chooseVehicleOrGhostForVPP,
} from "../../src/components/rightPanel"
import RoutesContext from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useVehicleAndRouteForNotification from "../../src/hooks/useVehicleAndRouteForNotification"
import {
  Notification,
  NotificationReason,
  VehicleOrGhost,
} from "../../src/realtime"
import { Route } from "../../src/schedule.d"
import {
  initialState,
  setNotificationIsInactive,
  setNotificationIsLoading,
} from "../../src/state"

jest.mock("../../src/hooks/useTimepoints", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))
jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))
jest.mock("../../src/hooks/useVehicleAndRouteForNotification", () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
}))

const mockDispatch = jest.fn()

describe("RightPanel", () => {
  test("sets notification as inactive when appropriate", () => {
    ;(useVehicleAndRouteForNotification as jest.Mock).mockImplementationOnce(
      () => null
    )

    mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RoutesContext.Provider value={routes}>
          <RightPanel />
        </RoutesContext.Provider>
      </StateDispatchProvider>
    )
    expect(mockDispatch).toHaveBeenCalledWith(setNotificationIsInactive())
  })

  test("shows loading spinner when appropriate", () => {
    ;(useVehicleAndRouteForNotification as jest.Mock).mockImplementationOnce(
      () => undefined
    )

    const notification: Notification = {
      id: 123,
      createdAt: new Date(),
      reason: "other" as NotificationReason,
      routeIds: [],
      runIds: [],
      tripIds: ["123", "456", "789"],
      operatorName: null,
      operatorId: null,
      routeIdAtCreation: null,
      startTime: new Date(),
    }

    const state = { ...initialState, selectedNotification: notification }
    mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <RoutesContext.Provider value={routes}>
          <RightPanel />
        </RoutesContext.Provider>
      </StateDispatchProvider>
    )
    expect(mockDispatch).toHaveBeenCalledWith(setNotificationIsLoading(true))
  })

  test("clears loading spinner when appropriate", () => {
    ;(useVehicleAndRouteForNotification as jest.Mock).mockImplementationOnce(
      () => ({ vehicleOrGhostData: undefined, routeData: undefined })
    )

    const state = initialState
    mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <RoutesContext.Provider value={routes}>
          <RightPanel />
        </RoutesContext.Provider>
      </StateDispatchProvider>
    )
    expect(mockDispatch).toHaveBeenCalledWith(setNotificationIsLoading(false))
  })
})

describe("chooseVehicleOrGhostForVPP", () => {
  test("uses the vehicleAndRouteForNotification by preference", () => {
    const vehicle1: VehicleOrGhost = {
      id: "v1",
      directionId: 0,
      routeId: "1",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "hhgat",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
    }

    const vehicle2: VehicleOrGhost = {
      id: "v2",
      directionId: 0,
      routeId: "1",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "hhgat",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
    }

    const route: Route = {
      id: "1",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "1",
    }
    expect(
      chooseVehicleOrGhostForVPP({ vehicleOrGhost: vehicle1, route }, vehicle2)
    ).toEqual(vehicle1)
    expect(chooseVehicleOrGhostForVPP(undefined, vehicle2)).toEqual(vehicle2)
  })
})

const routes: Route[] = [
  { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "1" },
  { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "28" },
]
