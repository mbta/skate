import React from "react"
import renderer from "react-test-renderer"
import Modal from "../../src/components/modal"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import VehicleForNotificationContext from "../../src/contexts/vehicleForNotificationContext"
import { Notification, NotificationReason } from "../../src/realtime"
import { initialState, State } from "../../src/state"

describe("Modal", () => {
  test("renders inactive notification modal when appropriate", () => {
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

    const state: State = {
      ...initialState,
      selectedNotification: notification,
    }
    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehicleForNotificationContext.Provider value={null}>
          <Modal />
        </VehicleForNotificationContext.Provider>
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders loading modal when appropriate", () => {
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

    const state: State = {
      ...initialState,
      selectedNotification: notification,
    }
    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehicleForNotificationContext.Provider value={undefined}>
          <Modal />
        </VehicleForNotificationContext.Provider>
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })
})
