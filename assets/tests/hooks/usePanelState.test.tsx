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
  setTabMode,
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
  describe("openVehiclePropertiesPanel", () => {
    test("sends vehicle", () => {
      const mock = jest.fn()
      const vehicle = vehicleFactory.build()

      const cb = usePanelStateForViewState(viewFactory.build(), mock)

      cb.openVehiclePropertiesPanel(vehicle)

      expect(mock).toHaveBeenCalledWith(selectVehicle(vehicle, "status"))
    })

    test("sends TabMode", () => {
      const mock = jest.fn()
      const tabMode = "block"

      const cb = usePanelStateForViewState(viewFactory.build(), mock)

      cb.setTabMode(tabMode)

      expect(mock).toHaveBeenCalledWith(setTabMode(tabMode))
    })
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

  describe("isViewOpen", () => {
    test("returns false when no view open", () => {
      const path = PagePath.Ladders
      const pageViewState = pageViewFactory.build({
        openView: OpenView.None,
        selectedVehicleOrGhost: null,
      })

      const { isViewOpen } = usePanelStateForViewState(
        viewFactory.build({ state: { [path]: pageViewState } }),
        jest.fn()
      )

      expect(isViewOpen).toBeFalsy()
    })

    test("returns true when a view is open", () => {
      const path = PagePath.Ladders
      const pageViewState = pageViewFactory.build({
        openView: OpenView.Swings,
        selectedVehicleOrGhost: null,
      })

      const { isViewOpen } = usePanelStateForViewState(
        viewFactory.build({ state: { [path]: pageViewState } }),
        jest.fn()
      )

      expect(isViewOpen).toBeTruthy()
    })

    test("returns true when a view is open", () => {
      const path = PagePath.Ladders
      const pageViewState = pageViewFactory.build({
        openView: OpenView.None,
        selectedVehicleOrGhost: vehicleFactory.build(),
      })

      const { isViewOpen } = usePanelStateForViewState(
        viewFactory.build({ state: { [path]: pageViewState } }),
        jest.fn()
      )

      expect(isViewOpen).toBeTruthy()
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
