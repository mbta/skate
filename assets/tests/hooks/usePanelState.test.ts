import { expect, describe, test } from "@jest/globals"
import { act, renderHook } from "@testing-library/react"
import { usePanelStateWithReducer } from "../../src/hooks/usePanelState"
import vehicleFactory from "../factories/vehicle"
import {
  OpenView,
  PagePath,
  PageViewState,
  ViewState,
} from "../../src/state/pagePanelState"
import { DeepPartial } from "fishery"
import { viewFactory } from "../factories/pagePanelStateFactory"

const renderUsePanelState = ({
  initialProps,
  currentState,
}: {
  initialProps?: DeepPartial<ViewState>
  currentState?: DeepPartial<PageViewState>
}) => {
  return renderHook(
    (initialState: DeepPartial<ViewState>) =>
      usePanelStateWithReducer(
        viewFactory.currentState(currentState ?? {}).build(initialState)
      ),
    {
      initialProps,
    }
  )
}

describe("openVehiclePropertiesPanel", () => {
  test("selects vehicle", () => {
    const { result } = renderUsePanelState({})

    const vehicle = vehicleFactory.build()

    expect(result.current.currentView.selectedVehicleOrGhost).toBe(undefined)

    act(() => result.current.openVehiclePropertiesPanel(vehicle))

    expect(result.current.currentView.selectedVehicleOrGhost).toBe(vehicle)
  })

  test.each([
    { openView: OpenView.Swings, name: "Swings View" },
    { openView: OpenView.NotificationDrawer, name: "Notifications Drawer" },
    { openView: OpenView.Late, name: "Late View" },
  ])("closes $name, records $name as previous view", ({ openView }) => {
    const { result } = renderUsePanelState({
      currentState: {
        openView,
      },
    })

    const vehicle = vehicleFactory.build()

    expect(result.current.currentView.openView).toBe(openView)
    expect(result.current.currentView.previousView).toBe(OpenView.None)
    expect(result.current.currentView.selectedVehicleOrGhost).toBe(undefined)

    act(() => result.current.openVehiclePropertiesPanel(vehicle))

    expect(result.current.currentView.openView).toBe(OpenView.None)
    expect(result.current.currentView.previousView).toBe(openView)
    expect(result.current.currentView.selectedVehicleOrGhost).toBe(vehicle)
  })
})

test("openPreviousView returns to the previous view, deselects vehicle", () => {
  const previousView = OpenView.NotificationDrawer
  const state = viewFactory
    .withVehicle()
    .currentState({
      openView: OpenView.Swings,
      previousView,
    })
    .build()

  const { result } = renderUsePanelState({ initialProps: state })

  act(() => result.current.openPreviousView())

  expect(result.current.currentView.selectedVehicleOrGhost).toBeUndefined()
  expect(result.current.currentView.openView).toEqual(previousView)
})

test("closeView closes any open views and deselects the vehicle", () => {
  const selectedVehicleOrGhost = vehicleFactory.build()

  const { result } = renderUsePanelState({
    currentState: { selectedVehicleOrGhost },
  })

  expect(result.current.currentView.selectedVehicleOrGhost).toStrictEqual(
    selectedVehicleOrGhost
  )

  act(result.current.closeView)

  expect(result.current.currentView.selectedVehicleOrGhost).toBeUndefined()
})

describe("setPath", () => {
  test("stores and loads VPP state based on path", () => {
    const [slot1, slot2] = [PagePath.Ladders, PagePath.Shuttles]
    const [vehicle1, vehicle2] = vehicleFactory.buildList(2)

    const { result } = renderUsePanelState({
      initialProps: { currentPath: slot1 },
    })

    // Stores vehicle in `currentView`
    act(() => {
      result.current.openVehiclePropertiesPanel(vehicle1)
    })
    expect(result.current.currentView.selectedVehicleOrGhost).toBe(vehicle1)

    // changing path should change `currentView`'s `selectedVehicleOrGhost`
    act(() => {
      result.current.setPath(slot2)
    })
    expect(result.current.currentView.selectedVehicleOrGhost).toBeUndefined()

    // Stores vehicle in `currentView` in a different slot
    act(() => {
      result.current.openVehiclePropertiesPanel(vehicle2)
    })
    expect(result.current.currentView.selectedVehicleOrGhost).toBe(vehicle2)

    // Can recall vehicle from previous slot
    act(() => {
      result.current.setPath(slot1)
    })
    expect(result.current.currentView.selectedVehicleOrGhost).toBe(vehicle1)
  })

  test("closes any open views", () => {
    const { result } = renderUsePanelState({
      initialProps: { currentPath: PagePath.Ladders },
      currentState: {
        openView: OpenView.Swings,
      },
    })

    expect(result.current.currentView.openView).toBe(OpenView.Swings)

    act(() => {
      result.current.setPath(PagePath.Shuttles)
      result.current.setPath(PagePath.Ladders)
    })

    expect(result.current.currentView.openView).toBe(OpenView.None)
  })
})

describe("calling open view function", () => {
  describe.each([
    { startingWith: "None", initialView: OpenView.None },
    { startingWith: "Swings View", initialView: OpenView.Swings },
    { startingWith: "Late View", initialView: OpenView.Late },
    {
      startingWith: "Notifications Drawer",
      initialView: OpenView.NotificationDrawer,
    },
  ])("starting from $startingWith", ({ initialView }) => {
    test.each([
      {
        view: "Swings",
        fn: ({ openSwingsView }: ReturnType<typeof usePanelStateWithReducer>) =>
          openSwingsView(),
        targetView: OpenView.Swings,
      },
      {
        view: "Late View",
        fn: ({ openLateView }) => openLateView(),
        targetView: OpenView.Late,
      },
      {
        view: "Notifications Drawer",
        fn: ({ openNotificationDrawer }) => openNotificationDrawer(),
        targetView: OpenView.NotificationDrawer,
      },
    ])("opens $view", ({ fn, targetView }) => {
      const { result } = renderUsePanelState({
        currentState: { openView: initialView },
      })

      act(() => fn(result.current))

      expect(result.current.currentView.openView).toBe(targetView)

      // Changing to the same view should have no effect
      act(() => fn(result.current))

      expect(result.current.currentView.openView).toBe(targetView)
    })
  })
})
