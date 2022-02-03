import React from "react"
import renderer from "react-test-renderer"
import Modal from "../../src/components/modal"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { useMinischeduleRuns } from "../../src/hooks/useMinischedule"
import {
  Notification,
  NotificationReason,
  NotificationState,
} from "../../src/realtime"
import { initialState, State } from "../../src/state"

jest.mock("../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRuns: jest.fn(),
}))

describe("Modal", () => {
  test("renders inactive notification modal when appropriate", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [])
    const notification: Notification = {
      id: "123",
      createdAt: new Date(),
      reason: "other" as NotificationReason,
      routeIds: [],
      runIds: [],
      tripIds: ["123", "456", "789"],
      operatorName: null,
      operatorId: null,
      routeIdAtCreation: null,
      startTime: new Date(),
      endTime: new Date(),
      state: "unread" as NotificationState,
    }

    const state: State = {
      ...initialState,
      selectedNotification: notification,
      selectedVehicleOrGhost: null,
    }
    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders loading modal when appropriate", () => {
    const notification: Notification = {
      id: "123",
      createdAt: new Date(),
      reason: "other" as NotificationReason,
      routeIds: [],
      runIds: [],
      tripIds: ["123", "456", "789"],
      operatorName: null,
      operatorId: null,
      routeIdAtCreation: null,
      startTime: new Date(),
      endTime: new Date(),
      state: "unread" as NotificationState,
    }

    const state: State = {
      ...initialState,
      selectedNotification: notification,
      selectedVehicleOrGhost: undefined,
    }
    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders create preset modal", () => {
    const createCallback = jest.fn()

    const state: State = {
      ...initialState,
      openInputModal: {
        type: "CREATE_PRESET",
        createCallback,
      },
    }

    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders save preset modal", () => {
    const saveCallback = jest.fn()

    const state: State = {
      ...initialState,
      openInputModal: {
        type: "SAVE_PRESET",
        presetName: "My Preset",
        saveCallback,
      },
    }

    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("renders delete preset modal", () => {
    const deleteCallback = jest.fn()

    const state: State = {
      ...initialState,
      openInputModal: {
        type: "DELETE_PRESET",
        presetName: "My Preset",
        deleteCallback,
      },
    }

    const tree = renderer.create(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })
})
