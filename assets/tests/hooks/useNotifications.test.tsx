import { renderHook } from "@testing-library/react-hooks"
import { Socket } from "phoenix"
import React, { ReactElement } from "react"
import { SocketProvider } from "../../src/contexts/socketContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { useNotifications } from "../../src/hooks/useNotifications"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import * as browser from "../../src/models/browser"
import { NotificationData } from "../../src/models/notificationData"
import { NotificationState } from "../../src/realtime.d"
import { RouteId } from "../../src/schedule"
import { initialState } from "../../src/state"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import routeTabFactory from "../factories/routeTab"

// tslint:disable: react-hooks-nesting

const notificationData: NotificationData = {
  id: "12345",
  created_at: 0,
  reason: "manpower",
  route_ids: ["route"],
  run_ids: ["run"],
  trip_ids: ["trip"],
  operator_name: null,
  operator_id: null,
  route_id_at_creation: null,
  start_time: 123_456,
  end_time: 234_567,
  state: "unread" as NotificationState,
}

describe("useNotifications", () => {
  test("opens a channel and processes any initial notifications", () => {
    const mockAddNotification = jest.fn()
    const mockSetNotifications = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      initial_notifications: ["notification1", "notification2"],
    })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(
      () => {
        useNotifications(mockAddNotification, mockSetNotifications)
      },
      { wrapper: wrapper(mockSocket, ["route"]) }
    )

    expect(mockChannel.join).toHaveBeenCalled()
    expect(mockAddNotification).toHaveBeenCalledTimes(0)
    expect(mockSetNotifications).toHaveBeenCalledTimes(1)
  })

  test("applies the callback on new notifications", () => {
    const mockAddNotification = jest.fn()
    const mockSetNotifications = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    mockChannel.on.mockImplementation((_event, dataHandler) => {
      dataHandler({
        data: notificationData,
      })
    })

    renderHook(
      () => {
        useNotifications(mockAddNotification, mockSetNotifications)
      },
      { wrapper: wrapper(mockSocket, ["route"]) }
    )

    expect(mockAddNotification).toHaveBeenCalledTimes(1)
    const notification = mockAddNotification.mock.calls[0][0]
    expect(notification.tripIds).toEqual(notificationData.trip_ids)
  })

  test("leaves the channel on unmount", () => {
    const mockAddNotification = jest.fn()
    const mockSetNotifications = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { unmount } = renderHook(
      () => {
        useNotifications(mockAddNotification, mockSetNotifications)
      },
      { wrapper: wrapper(mockSocket, []) }
    )

    expect(mockChannel.join).toHaveBeenCalled()

    unmount()

    expect(mockChannel.leave).toHaveBeenCalled()
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce((msg) => msg)
    const mockAddNotification = jest.fn()
    const mockSetNotifications = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(
      () => {
        useNotifications(mockAddNotification, mockSetNotifications)
      },
      { wrapper: wrapper(mockSocket, []) }
    )

    expect(spyConsoleError).toHaveBeenCalled()
    spyConsoleError.mockRestore()
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockAddNotification = jest.fn()
    const mockSetNotifications = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(
      () => {
        useNotifications(mockAddNotification, mockSetNotifications)
      },
      { wrapper: wrapper(mockSocket, []) }
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})

const wrapper =
  (socket: Socket | undefined, selectedRouteIds: RouteId[]) =>
  ({ children }: { children: ReactElement<HTMLElement> }) =>
    (
      <SocketProvider
        socketStatus={{ socket, connectionStatus: ConnectionStatus.Connected }}
      >
        <StateDispatchProvider
          state={{
            ...initialState,
            routeTabs: [routeTabFactory.build({ selectedRouteIds })],
          }}
          dispatch={jest.fn()}
        >
          {children}
        </StateDispatchProvider>
      </SocketProvider>
    )
