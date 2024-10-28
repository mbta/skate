import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import Modal from "../../src/components/modal"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { useMinischeduleRuns } from "../../src/hooks/useMinischedule"
import { Notification } from "../../src/realtime"
import { State } from "../../src/state"
import stateFactory from "../factories/applicationState"
import { viewFactory } from "../factories/pagePanelStateFactory"
import {
  blockWaiverNotificationFactory,
  bridgeLoweredNotificationFactory,
  bridgeRaisedNotificationFactory,
} from "../factories/notification"
import userEvent from "@testing-library/user-event"
import { RealDispatchWrapper } from "../testHelpers/wrappers"

jest.mock("../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRuns: jest.fn(),
}))

describe("Modal", () => {
  test("renders inactive notification modal when appropriate", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [])
    const notification: Notification = blockWaiverNotificationFactory.build({
      id: "123",
      createdAt: new Date(),
      state: "unread",
      content: {
        reason: "other",
        routeIds: [],
        runIds: [],
        tripIds: ["123", "456", "789"],
      },
    })

    const state: State = stateFactory.build({
      selectedNotification: notification,
      view: viewFactory
        .currentState({
          selectedVehicleOrGhost: null,
        })
        .build(),
    })
    const { baseElement } = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders loading modal when appropriate", () => {
    const notification: Notification = blockWaiverNotificationFactory.build({
      id: "123",
      createdAt: new Date(),
      state: "unread",
      content: {
        reason: "other",
        routeIds: [],
        runIds: [],
        tripIds: ["123", "456", "789"],
      },
    })

    const state: State = stateFactory.build({
      selectedNotification: notification,
      view: viewFactory
        .currentState({
          selectedVehicleOrGhost: undefined,
        })
        .build(),
    })
    const { baseElement } = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders create preset modal", () => {
    const createCallback = jest.fn()
    const confirmOverwriteCallback = jest.fn()

    const state: State = stateFactory.build({
      openInputModal: {
        type: "CREATE_PRESET",
        createCallback,
        confirmOverwriteCallback,
      },
    })

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(result.getByText("Save open routes as preset")).not.toBeNull()
  })

  test("create preset modal closes on escape", async () => {
    const createCallback = jest.fn()
    const confirmOverwriteCallback = jest.fn()

    render(
      <RealDispatchWrapper
        initialState={stateFactory.build({
          openInputModal: {
            type: "CREATE_PRESET",
            createCallback,
            confirmOverwriteCallback,
          },
        })}
      >
        <Modal />
      </RealDispatchWrapper>
    )
    const modal = screen.getByText("Save open routes as preset")
    expect(modal).toBeVisible()
    userEvent.keyboard("{Escape}")
    await waitFor(() => expect(modal).not.toBeInTheDocument())
  })

  test("renders save preset modal", () => {
    const saveCallback = jest.fn()

    const state: State = stateFactory.build({
      openInputModal: {
        type: "SAVE_PRESET",
        presetName: "My Preset",
        saveCallback,
      },
    })

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(result.getByText(/Overwrite/)).not.toBeNull()
  })

  test("renders delete preset modal", () => {
    const deleteCallback = jest.fn()

    const state: State = stateFactory.build({
      openInputModal: {
        type: "DELETE_PRESET",
        presetName: "My Preset",
        deleteCallback,
      },
    })

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(result.getByText(/Delete/)).not.toBeNull()
  })

  test("renders overwrite preset modal", () => {
    const confirmCallback = jest.fn()

    const state: State = stateFactory.build({
      openInputModal: {
        type: "OVERWRITE_PRESET",
        presetName: "My Preset",
        confirmCallback,
      },
    })

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(result.getByText(/A preset named/)).not.toBeNull()
  })

  test("renders Chelsea Raised modal", () => {
    const notification: Notification = bridgeRaisedNotificationFactory.build({
      content: {
        loweringTime: new Date("2020-10-06 07:45"),
      },
    })

    const state: State = stateFactory.build({
      selectedNotification: notification,
      view: viewFactory
        .currentState({
          selectedVehicleOrGhost: undefined,
        })
        .build(),
    })
    const { baseElement } = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders Chelsea Lowered modal", () => {
    const notification: Notification = bridgeLoweredNotificationFactory.build()

    const state: State = stateFactory.build({
      selectedNotification: notification,
      view: viewFactory
        .currentState({
          selectedVehicleOrGhost: undefined,
        })
        .build(),
    })
    const { baseElement } = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <Modal />
      </StateDispatchProvider>
    )
    expect(baseElement).toMatchSnapshot()
  })
})
