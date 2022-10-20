import React from "react"
import { act, renderHook } from "@testing-library/react"
import { Socket } from "phoenix"
import { ReactNode } from "react"
import { SocketProvider } from "../../src/contexts/socketContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  hideLatestNotification,
  markAllAsRead,
  reducer,
  setNotifications,
  toggleReadState,
  useNotificationsReducer,
} from "../../src/hooks/useNotificationsReducer"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import { NotificationData } from "../../src/models/notificationData"
import { Notification, NotificationState } from "../../src/realtime"
import { RouteId } from "../../src/schedule"
import { initialState } from "../../src/state"
import { mockUseReducerOnce } from "../testHelpers/mockHelpers"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import routeTabFactory from "../factories/routeTab"
import * as browser from "../../src/models/browser"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

const notification1: Notification = {
  id: "0",
  createdAt: new Date(0),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: ["trip1", "trip2"],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(0),
  endTime: new Date(100_000),
  state: "unread" as NotificationState,
}

const notification1Data: NotificationData = {
  id: "0",
  created_at: 0,
  reason: "manpower",
  route_ids: ["route1", "route2"],
  run_ids: ["run1", "run2"],
  trip_ids: ["trip1", "trip2"],
  operator_name: null,
  operator_id: null,
  route_id_at_creation: null,
  start_time: 0,
  end_time: 100,
  state: "unread",
}

const notification2: Notification = {
  id: "1",
  createdAt: new Date(1),
  reason: "accident",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(1),
  endTime: new Date(100),
  state: "unread" as NotificationState,
}

const expectPut = (url: string) =>
  expect(window.fetch).toHaveBeenCalledWith(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-csrf-token": "" },
  })

describe("notificationsReducer", () => {
  test("mark all as read sets all notification states and leaves show-latest alone", () => {
    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    const resultState = reducer(initialState, markAllAsRead())
    expect(
      resultState.notifications.map((notification) => notification.state)
    ).toEqual(["read", "read"])
    expect(resultState.showLatestNotification).toEqual(true)
  })

  test("set notifications on the initial page load and show the latest", () => {
    const initialState = {
      notifications: [],
      showLatestNotification: true,
    }
    const resultState = reducer(
      initialState,
      setNotifications([notification1], true)
    )
    expect(resultState.notifications).toEqual([notification1])
    expect(resultState.showLatestNotification).toEqual(true)
  })

  test("resetting notifications after the initial page load leaves the show-latest flag alone", () => {
    const initialState = {
      notifications: [],
      showLatestNotification: false,
    }
    const resultState = reducer(
      initialState,
      setNotifications([notification1], false)
    )
    expect(resultState.notifications).toEqual([notification1])
    expect(resultState.showLatestNotification).toEqual(false)
  })

  test("toggle read state affects just the one notification", () => {
    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }

    const resultState = reducer(initialState, toggleReadState(notification1))
    expect(resultState.notifications).toEqual([
      { ...notification1, state: "read" },
      notification2,
    ])
  })

  test("hiding read notification leaves notifications alone", () => {
    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    const resultState = reducer(initialState, hideLatestNotification())
    expect(resultState).toEqual({
      notifications: [notification1, notification2],
      showLatestNotification: false,
    })
  })
})

describe("useNotificationsReducer", () => {
  test("persists to server when mark all as read", () => {
    window.fetch = jest.fn()
    const mockSetIsInitialLoad = jest.fn()

    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    mockUseReducerOnce(reducer, initialState)

    const { result } = renderHook(() =>
      useNotificationsReducer(true, mockSetIsInitialLoad)
    )

    const [, dispatch] = result.current

    act(() => {
      dispatch(markAllAsRead())
    })

    expectPut(
      "/api/notification_read_state?new_state=read&notification_ids=0,1"
    )
  })

  test("persists state toggle", () => {
    window.fetch = jest.fn()
    const mockSetIsInitialLoad = jest.fn()

    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    mockUseReducerOnce(reducer, initialState)

    const { result } = renderHook(() =>
      useNotificationsReducer(true, mockSetIsInitialLoad)
    )

    const [, dispatch] = result.current

    act(() => {
      dispatch(toggleReadState(notification2))
    })

    expectPut("/api/notification_read_state?new_state=read&notification_ids=1")
  })

  test("opens a channel and processes any initial notifications, unsets the initial render flag via callback", () => {
    const initialNotifications = [notification1Data]
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: {
        initial_notifications: initialNotifications,
      },
    })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(
      () => useNotificationsReducer(true, mockSetIsInitialLoad),
      {
        wrapper: ({ children }) => (
          <Wrapper socket={mockSocket} selectedRouteIds={["route"]}>
            {children}
          </Wrapper>
        ),
      }
    )

    const [state] = result.current

    expect(mockChannel.join).toHaveBeenCalled()
    expect(state.notifications).toStrictEqual([notification1])
    expect(mockSetIsInitialLoad).toHaveBeenCalledWith(false)
  })

  test("adds new notifications", () => {
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    mockChannel.on.mockImplementation((_event, dataHandler) => {
      dataHandler({
        data: notification1Data,
      })
    })

    const { result } = renderHook(
      () => useNotificationsReducer(true, mockSetIsInitialLoad),
      {
        wrapper: ({ children }) => (
          <Wrapper socket={mockSocket} selectedRouteIds={["route"]}>
            {children}
          </Wrapper>
        ),
      }
    )

    const [state] = result.current

    expect(state.notifications).toStrictEqual([notification1])
    expect(tagManagerEvent).toHaveBeenCalledWith("notification_delivered")
  })

  test("leaves the channel on unmount", () => {
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { unmount } = renderHook(
      () => useNotificationsReducer(false, mockSetIsInitialLoad),
      {
        wrapper: ({ children }) => (
          <Wrapper socket={mockSocket} selectedRouteIds={[]}>
            {children}
          </Wrapper>
        ),
      }
    )

    expect(mockChannel.join).toHaveBeenCalled()

    unmount()

    expect(mockChannel.leave).toHaveBeenCalled()
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce((msg) => msg)
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useNotificationsReducer(true, mockSetIsInitialLoad), {
      wrapper: ({ children }) => (
        <Wrapper socket={mockSocket} selectedRouteIds={[]}>
          {children}
        </Wrapper>
      ),
    })

    expect(spyConsoleError).toHaveBeenCalled()
    spyConsoleError.mockRestore()
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useNotificationsReducer(false, mockSetIsInitialLoad), {
      wrapper: ({ children }) => (
        <Wrapper socket={mockSocket} selectedRouteIds={[]}>
          {children}
        </Wrapper>
      ),
    })

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("doesn't rejoin channel on every render", () => {
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: { initial_notifications: [] },
    })
    mockSocket.channel.mockImplementation(() => mockChannel)
    let selectedRouteIds = ["route"]

    const { rerender } = renderHook(
      () => useNotificationsReducer(false, mockSetIsInitialLoad),
      {
        wrapper: ({ children }) => (
          <Wrapper socket={mockSocket} selectedRouteIds={selectedRouteIds}>
            {children}
          </Wrapper>
        ),
      }
    )
    rerender()

    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("doesn't rejoin channel when route IDs don't change", () => {
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: {
        initial_notifications: [],
      },
    })
    mockSocket.channel.mockImplementation(() => mockChannel)
    let selectedRouteIds = ["route"]

    const { rerender } = renderHook(
      () => useNotificationsReducer(false, mockSetIsInitialLoad),
      {
        wrapper: ({ children }) => (
          <Wrapper socket={mockSocket} selectedRouteIds={selectedRouteIds}>
            {children}
          </Wrapper>
        ),
      }
    )
    selectedRouteIds = ["route"]
    rerender()

    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("rejoins channel if selected routes change", () => {
    const mockSetIsInitialLoad = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: {
        initial_notifications: [],
      },
    })
    mockSocket.channel.mockImplementation(() => mockChannel)
    let selectedRouteIds = ["route1"]

    const { rerender } = renderHook(
      () => useNotificationsReducer(false, mockSetIsInitialLoad),
      {
        wrapper: ({ children }) => (
          <Wrapper socket={mockSocket} selectedRouteIds={selectedRouteIds}>
            {children}
          </Wrapper>
        ),
      }
    )
    selectedRouteIds = ["route1", "route2"]
    rerender()

    expect(mockChannel.join).toHaveBeenCalledTimes(2)
  })
})

const Wrapper = ({
  children,
  socket,
  selectedRouteIds,
}: {
  children?: ReactNode
  socket: Socket | undefined
  selectedRouteIds: RouteId[]
}) => (
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
      <> {children} </>
    </StateDispatchProvider>
  </SocketProvider>
)
