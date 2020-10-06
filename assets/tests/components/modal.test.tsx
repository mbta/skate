import React from "react"
import renderer from "react-test-renderer"
import Modal from "../../src/components/modal"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
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
      selectedNotificationIsInactive: true,
    }
    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })
})
