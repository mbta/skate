import { expect, test, jest, describe } from "@jest/globals"
import {
  usePanelStateForViewState,
  usePanelStateFromStateDispatchContext,
} from "../../src/hooks/usePanelState"
import vehicleFactory from "../factories/vehicle"
import {
  OpenView,
  PagePath,
  closeView,
  openLateView,
  openNotificaitonDrawer,
  openPreviousView,
  openSwingsView,
  selectVehicle,
  setPath,
} from "../../src/state/pagePanelState"
import {
  pageViewFactory,
  viewFactory,
} from "../factories/pagePanelStateFactory"
import { renderHook } from "@testing-library/react"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import React from "react"
import stateFactory from "../factories/applicationState"

describe("usePanelStateForViewState", () => {
  test("openVehiclePropertiesPanel", () => {
    const mock = jest.fn()
    const vehicle = vehicleFactory.build()

    const cb = usePanelStateForViewState(viewFactory.build(), mock)

    cb.openVehiclePropertiesPanel(vehicle)

    expect(mock).toHaveBeenCalledWith(selectVehicle(vehicle))
  })

  test("setPath", () => {
    const mock = jest.fn()
    const currentPath = PagePath.Shuttles
    const path = PagePath.Ladders

    const cb = usePanelStateForViewState(
      viewFactory.build({ currentPath }),
      mock
    )

    cb.setPath(path)

    expect(mock).toHaveBeenCalledWith(setPath(path))
  })

  test("openNotificationDrawer", () => {
    const mock = jest.fn()

    const cb = usePanelStateForViewState(viewFactory.build(), mock)

    cb.openNotificationDrawer()

    expect(mock).toHaveBeenCalledWith(openNotificaitonDrawer())
  })

  test("openSwingsView", () => {
    const mock = jest.fn()

    const cb = usePanelStateForViewState(viewFactory.build(), mock)

    cb.openSwingsView()

    expect(mock).toHaveBeenCalledWith(openSwingsView())
  })

  test("openLateView", () => {
    const mock = jest.fn()

    const cb = usePanelStateForViewState(viewFactory.build(), mock)

    cb.openLateView()

    expect(mock).toHaveBeenCalledWith(openLateView())
  })

  test("openPreviousView", () => {
    const mock = jest.fn()

    const cb = usePanelStateForViewState(viewFactory.build(), mock)

    cb.openPreviousView()

    expect(mock).toHaveBeenCalledWith(openPreviousView())
  })

  test("closeView", () => {
    const mock = jest.fn()

    const cb = usePanelStateForViewState(viewFactory.build(), mock)

    cb.closeView()

    expect(mock).toHaveBeenCalledWith(closeView())
  })

  describe("currentView", () => {
    test("should return the active state", () => {
      const [currentPath, otherPath] = [PagePath.Search, PagePath.Ladders]
      const otherState = pageViewFactory.build({
        openView: OpenView.Swings,
      })
      const currentState = pageViewFactory.build({
        openView: OpenView.NotificationDrawer,
      })

      const { currentView } = usePanelStateForViewState(
        viewFactory.build({
          currentPath,
          state: {
            [currentPath]: currentState,
            [otherPath]: otherState,
          },
        }),
        jest.fn()
      )

      expect(currentView).toEqual(currentState)
      expect(currentView).not.toEqual(otherState)
    })
  })
})

describe("usePanelStateFromStateDispatchContext", () => {
  test("provides currentView from context", () => {
    const currentState = pageViewFactory.build({
      openView: OpenView.NotificationDrawer,
    })

    const { result } = renderHook(
      () => usePanelStateFromStateDispatchContext(),
      {
        wrapper: ({ children }) => (
          <StateDispatchProvider
            dispatch={jest.fn()}
            state={stateFactory.build({
              view: viewFactory.currentState(currentState).build(),
            })}
          >
            {children}
          </StateDispatchProvider>
        ),
      }
    )

    expect(result.current.currentView).toEqual(currentState)
  })

  test("sends callbacks to StateDispatchContext", () => {
    const dispatch = jest.fn()

    const { result } = renderHook(
      () => usePanelStateFromStateDispatchContext(),
      {
        wrapper: ({ children }) => (
          <StateDispatchProvider
            dispatch={dispatch}
            state={stateFactory.build()}
          >
            {children}
          </StateDispatchProvider>
        ),
      }
    )

    result.current.closeView()

    expect(dispatch).toHaveBeenCalledWith(closeView())
  })
})
