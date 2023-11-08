import { expect, describe, test } from "@jest/globals"
import vehicleFactory from "../factories/vehicle"
import {
  OpenView,
  PagePath,
  closeView,
  openLateView,
  openNotificaitonDrawer,
  openPreviousView,
  openSwingsView,
  openViewReducer,
  selectVehicle,
  setPath,
} from "../../src/state/pagePanelState"
import { viewFactory } from "../factories/pagePanelStateFactory"
import { TabMode } from "../../src/components/propertiesPanel/tabPanels"

describe("openVehiclePropertiesPanel", () => {
  test("selects vehicle", () => {
    const vehicle = vehicleFactory.build()

    const state = openViewReducer(
      viewFactory
        .currentState({
          selectedVehicleOrGhost: undefined,
        })
        .build(),
      selectVehicle(vehicle, "status")
    )

    expect(state.state[state.currentPath].selectedVehicleOrGhost).toBe(vehicle)
  })

  test.each([
    { openView: OpenView.Swings, name: "Swings View" },
    { openView: OpenView.NotificationDrawer, name: "Notifications Drawer" },
    { openView: OpenView.Late, name: "Late View" },
  ])("closes $name, records $name as previous view", ({ openView }) => {
    const vehicle = vehicleFactory.build()
    const state = openViewReducer(
      viewFactory
        .currentState({
          selectedVehicleOrGhost: undefined,
          openView,
          previousView: OpenView.None,
        })
        .build(),
      selectVehicle(vehicle, "status")
    )

    expect(state.state[state.currentPath].openView).toBe(OpenView.None)
    expect(state.state[state.currentPath].previousView).toBe(openView)
    expect(state.state[state.currentPath].selectedVehicleOrGhost).toBe(vehicle)
  })


  test.each<{ tab: TabMode }>([
    { tab: "status" },
    { tab: "block" },
    { tab: "run" },
  ])("when vehicle is selected, can select a specific tab: $tab", ({ tab }) => {
    const vehicle = vehicleFactory.build()

    const state = openViewReducer(
      viewFactory
        .currentState({
          selectedVehicleOrGhost: undefined,
        })
        .build(),
      selectVehicle(vehicle, tab)
    )

    expect(state.state[state.currentPath].vppTabMode).toBe(tab)
  })
})

test("openPreviousView returns to the previous view, deselects vehicle", () => {
  const previousView = OpenView.NotificationDrawer
  const state = openViewReducer(
    viewFactory
      .currentState({
        openView: OpenView.Swings,
        previousView,
      })
      .withVehicle()
      .build(),
    openPreviousView()
  )

  expect(state.state[state.currentPath].openView).toBe(previousView)
  expect(state.state[state.currentPath].selectedVehicleOrGhost).toBeUndefined
})

describe("closeView", () => {
  test("deselects the vehicle", () => {
    const state = openViewReducer(
      viewFactory.withVehicle().build(),
      closeView()
    )

    expect(
      state.state[state.currentPath].selectedVehicleOrGhost
    ).toBeUndefined()
  })

  test("closes any open views", () => {
    const openView = OpenView.Late
    const state = openViewReducer(
      viewFactory
        .currentState({
          openView,
        })
        .build(),
      closeView()
    )

    expect(state.state[state.currentPath].openView).toBe(OpenView.None)
  })
})

describe("setPath", () => {
  test("sets the current path", () => {
    const newPath = PagePath.Search

    const state = openViewReducer(
      viewFactory.build({ currentPath: PagePath.Ladders }),
      setPath(newPath)
    )

    expect(state.currentPath).toBe(newPath)
  })

  test("stores and loads VPP state based on path", () => {
    const [slot1, slot2] = [PagePath.Ladders, PagePath.Shuttles]
    const [vehicle1, vehicle2] = vehicleFactory.buildList(2)

    const state = [
      setPath(slot1),
      selectVehicle(vehicle1, "status"),

      setPath(slot2),
      selectVehicle(vehicle2, "status"),
    ].reduce(openViewReducer, viewFactory.build())

    expect(state.state[slot1].selectedVehicleOrGhost).toBe(vehicle1)
    expect(state.state[slot2].selectedVehicleOrGhost).toBe(vehicle2)
  })

  test("closes any open views", () => {
    const pagePath = PagePath.Ladders

    const state2 = openViewReducer(
      viewFactory
        .currentState({
          openView: OpenView.Swings,
        })
        .build({ currentPath: pagePath }),
      setPath(PagePath.Search)
    )

    expect(state2.state[pagePath].openView).toBe(OpenView.None)
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
        action: openSwingsView(),
        targetView: OpenView.Swings,
      },
      {
        view: "Late View",
        action: openLateView(),
        targetView: OpenView.Late,
      },
      {
        view: "Notifications Drawer",
        action: openNotificaitonDrawer(),
        targetView: OpenView.NotificationDrawer,
      },
    ])("opens $view", ({ action, targetView }) => {
      let state = openViewReducer(
        viewFactory.currentState({ openView: initialView }).build(),
        action
      )

      expect(state.state[state.currentPath].openView).toBe(targetView)

      state = openViewReducer(state, action)

      expect(state.state[state.currentPath].openView).toBe(targetView)
    })
  })
})
