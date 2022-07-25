import {
  NotificationReason,
  NotificationState,
  Vehicle,
  VehicleId,
} from "../src/realtime.d"
import * as State from "../src/state"
import {
  VehicleLabelSetting,
  VehicleAdherenceColorsSetting,
} from "../src/userSettings"
import { RouteTab } from "../src/models/routeTab"

import vehicleFactory from "./factories/vehicle"
import routeTabFactory from "./factories/routeTab"

const initialState = State.initialState
const reducer = State.reducer

describe("reducer", () => {
  test("selectShuttleRun", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRunIds: ["28"],
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRunIds: ["28", "39"],
    }
    const newState = reducer(state, State.selectShuttleRun("39"))
    expect(newState).toEqual(expectedState)
  })

  test("selectShuttleRun sets a single run if the previous value was 'all'", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRunIds: "all",
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRunIds: ["39"],
    }
    const newState = reducer(state, State.selectShuttleRun("39"))
    expect(newState).toEqual(expectedState)
  })

  test("deselectShuttleRun", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRunIds: ["28", "39"],
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRunIds: ["28"],
    }
    const newState = reducer(state, State.deselectShuttleRun("39"))
    expect(newState).toEqual(expectedState)
  })

  test("selectAllShuttleRuns", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRunIds: ["28", "39"],
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRunIds: "all",
    }
    const newState = reducer(state, State.selectAllShuttleRuns())
    expect(newState).toEqual(expectedState)
  })

  test("deselectAllShuttleRuns", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRunIds: "all",
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRunIds: [],
    }
    const newState = reducer(state, State.deselectAllShuttleRuns())
    expect(newState).toEqual(expectedState)
  })

  test("deselectShuttleRun results in an empty list if you deselect the only selected run", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRunIds: ["39"],
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRunIds: [],
    }
    const newState = reducer(state, State.deselectShuttleRun("39"))
    expect(newState).toEqual(expectedState)
  })

  test("selectShuttleRoute", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRouteIds: ["shuttle1"],
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRouteIds: ["shuttle1", "shuttle2"],
    }
    const newState = reducer(state, State.selectShuttleRoute("shuttle2"))
    expect(newState).toEqual(expectedState)
  })

  test("deselectShuttleRoute", () => {
    const state: State.State = {
      ...initialState,
      selectedShuttleRouteIds: ["shuttle1", "shuttle2"],
    }
    const expectedState: State.State = {
      ...state,
      selectedShuttleRouteIds: ["shuttle1"],
    }
    const newState = reducer(state, State.deselectShuttleRoute("shuttle2"))
    expect(newState).toEqual(expectedState)
  })

  test("selectVehicle", () => {
    const vehicle: Vehicle = vehicleFactory.build()

    const state = initialState
    const expectedState = {
      ...state,
      selectedVehicleOrGhost: vehicle,
    }

    const newState = reducer(state, State.selectVehicle(vehicle))

    expect(newState).toEqual(expectedState)
  })

  test("deselectVehicle", () => {
    const initialVehicleId: VehicleId = "v1"
    const state = {
      ...initialState,
      selectedVehicleId: initialVehicleId,
    }
    const expectedState = {
      ...state,
      selectedVehicleId: undefined,
    }

    const newState = reducer(state, State.deselectVehicle())

    expect(newState).toEqual(expectedState)
  })

  test("togglePickerContainer", () => {
    const expectedState: State.State = {
      ...initialState,
      pickerContainerIsVisible: false,
    }

    const newState = reducer(initialState, State.togglePickerContainer())

    expect(newState).toEqual(expectedState)
  })

  test("toggleMobileMenu", () => {
    const expectedState: State.State = {
      ...initialState,
      mobileMenuIsOpen: true,
    }

    const newState = reducer(initialState, State.toggleMobileMenu())

    expect(newState).toEqual(expectedState)
  })

  test("toggleShowGaragesFilter", () => {
    const expectedState: State.State = {
      ...initialState,
      showGaragesFilter: true,
    }

    const newState = reducer(initialState, State.toggleShowGaragesFilter())

    expect(newState).toEqual(expectedState)
  })

  describe("notification drawer", () => {
    test("openNotificationDrawer opens the drawer", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: false,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: true,
      }
      expect(reducer(state, State.openNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("openNotificationDrawer closes swings view", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: false,
        openView: State.OpenView.Swings,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: true,
        openView: State.OpenView.None,
      }
      expect(reducer(state, State.openNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("openNotificationDrawer leaves late view open", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: false,
        openView: State.OpenView.Late,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: true,
        openView: State.OpenView.Late,
      }
      expect(reducer(state, State.openNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("openNotificationDrawer does nothing if the drawer is already open", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: true,
      }
      expect(reducer(state, State.openNotificationDrawer())).toEqual(state)
    })

    test("closeNotificationDrawer closes the drawer", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: true,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: false,
      }
      expect(reducer(state, State.closeNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("toggleNotificationDrawer opens the drawer if it's closed", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: false,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: true,
      }
      expect(reducer(state, State.toggleNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("toggleNotificationDrawer closes the drawer if it's open", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: true,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: false,
      }
      expect(reducer(state, State.toggleNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("toggleNotificationDrawer closes swings view when opening notifications drawer", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: false,
        openView: State.OpenView.Swings,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: true,
        openView: State.OpenView.None,
      }
      expect(reducer(state, State.toggleNotificationDrawer())).toEqual(
        expectedState
      )
    })

    test("toggleNotificationDrawer leaves late view open when opening notifications drawer", () => {
      const state = {
        ...initialState,
        notificationDrawerIsOpen: false,
        openView: State.OpenView.Late,
      }
      const expectedState = {
        ...initialState,
        notificationDrawerIsOpen: true,
        openView: State.OpenView.Late,
      }
      expect(reducer(state, State.toggleNotificationDrawer())).toEqual(
        expectedState
      )
    })
  })

  test("setLadderVehicleLabelSetting", () => {
    const ladderVehicleLabel: VehicleLabelSetting =
      VehicleLabelSetting.VehicleNumber
    const state = initialState
    const expectedState = {
      ...state,
      userSettings: {
        ...state.userSettings,
        ladderVehicleLabel,
      },
    }

    const newState = reducer(
      state,
      State.setLadderVehicleLabelSetting(ladderVehicleLabel)
    )

    expect(newState).toEqual(expectedState)
  })

  test("setShuttleVehicleLabelSetting", () => {
    const shuttleVehicleLabel: VehicleLabelSetting =
      VehicleLabelSetting.VehicleNumber
    const state = initialState
    const expectedState = {
      ...state,
      userSettings: {
        ...state.userSettings,
        shuttleVehicleLabel,
      },
    }

    const newState = reducer(
      state,
      State.setShuttleVehicleLabelSetting(shuttleVehicleLabel)
    )

    expect(newState).toEqual(expectedState)
  })

  test("setVehicleAdherenceColorsSetting", () => {
    const vehicleAdherenceColors: VehicleAdherenceColorsSetting =
      VehicleAdherenceColorsSetting.EarlyBlue
    const state = initialState
    const expectedState = {
      ...state,
      userSettings: {
        ...state.userSettings,
        vehicleAdherenceColors,
      },
    }

    const newState = reducer(
      state,
      State.setVehicleAdherenceColorsSetting(vehicleAdherenceColors)
    )

    expect(newState).toEqual(expectedState)
  })

  test("setNotification", () => {
    const notification = {
      id: "123",
      createdAt: new Date(),
      tripIds: ["123", "456", "789"],
      reason: "other" as NotificationReason,
      routeIds: [],
      runIds: [],
      operatorName: null,
      operatorId: null,
      routeIdAtCreation: null,
      startTime: new Date(),
      endTime: new Date(),
      state: "unread" as NotificationState,
    }
    const newState = reducer(initialState, State.setNotification(notification))
    const expectedState = {
      ...initialState,
      selectedNotification: notification,
    }
    expect(newState).toEqual(expectedState)
  })

  test("openSwingsView enables swings view when other views are closed", () => {
    const expectedState: State.State = {
      ...initialState,
      openView: State.OpenView.Swings,
    }

    const newState = reducer(initialState, State.openSwingsView())

    expect(newState).toEqual(expectedState)
  })

  test("openSwingsView enables swings view when late view is open", () => {
    const expectedState: State.State = {
      ...initialState,
      openView: State.OpenView.Swings,
    }

    const newState = reducer(
      { ...initialState, openView: State.OpenView.Late },
      State.openSwingsView()
    )

    expect(newState).toEqual(expectedState)
  })

  test("closeSwingsView disables swings view when swings view is open", () => {
    const newState = reducer(
      { ...initialState, openView: State.OpenView.Swings },
      State.closeSwingsView()
    )

    expect(newState).toEqual(initialState)
  })

  test("toggleLateView enables late view when other views are closed", () => {
    const expectedState: State.State = {
      ...initialState,
      openView: State.OpenView.Late,
    }

    const newState = reducer(initialState, State.toggleLateView())

    expect(newState).toEqual(expectedState)
  })

  test("toggleLateView enables late view when swings views is open", () => {
    const expectedState: State.State = {
      ...initialState,
      openView: State.OpenView.Late,
    }

    const newState = reducer(
      { ...initialState, openView: State.OpenView.Swings },
      State.toggleLateView()
    )

    expect(newState).toEqual(expectedState)
  })

  test("toggleLateView disables late view when late view is open", () => {
    const newState = reducer(
      { ...initialState, openView: State.OpenView.Late },
      State.toggleLateView()
    )

    expect(newState).toEqual(initialState)
  })

  test("selectVehicleFromNotification switches to appropriate route tab", () => {
    const originalRouteTab1 = routeTabFactory.build({
      isCurrentTab: false,
      ordering: 4,
      selectedRouteIds: ["87", "88"],
    })
    const originalRouteTab2 = routeTabFactory.build({
      isCurrentTab: false,
      ordering: 2,
      selectedRouteIds: ["88", "89"],
    })
    const originalRouteTab3 = routeTabFactory.build({
      isCurrentTab: true,
      ordering: 3,
      selectedRouteIds: ["1"],
    })
    const originalRouteTabs = [
      originalRouteTab1,
      originalRouteTab2,
      originalRouteTab3,
    ]

    const vehicle = vehicleFactory.build({ routeId: "88" })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: originalRouteTabs,
      },
      State.selectVehicleFromNotification(vehicle)
    )

    const expectedNewTabs = [
      originalRouteTab1,
      { ...originalRouteTab2, isCurrentTab: true },
      { ...originalRouteTab3, isCurrentTab: false },
    ]

    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
      selectedVehicleOrGhost: vehicle,
    }

    expect(newState).toMatchObject(expectedState)
  })

  test("selectVehicleFromNotification doesn't switch tabs is route is open in current tab", () => {
    const originalRouteTab1 = routeTabFactory.build({
      isCurrentTab: true,
      ordering: 4,
      selectedRouteIds: ["87", "88"],
    })
    const originalRouteTab2 = routeTabFactory.build({
      isCurrentTab: false,
      ordering: 2,
      selectedRouteIds: ["88", "89"],
    })
    const originalRouteTab3 = routeTabFactory.build({
      isCurrentTab: false,
      ordering: 3,
      selectedRouteIds: ["1"],
    })
    const originalRouteTabs = [
      originalRouteTab1,
      originalRouteTab2,
      originalRouteTab3,
    ]

    const vehicle = vehicleFactory.build({ routeId: "88" })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: originalRouteTabs,
      },
      State.selectVehicleFromNotification(vehicle)
    )

    const expectedState: State.State = {
      ...initialState,
      routeTabs: originalRouteTabs,
      routeTabsToPush: null,
      selectedVehicleOrGhost: vehicle,
    }

    expect(newState).toMatchObject(expectedState)
  })

  test("selectVehicleFromNotification does nothing to route tabs if route isn't open", () => {
    const routeTab = routeTabFactory.build({
      isCurrentTab: true,
      ordering: 0,
      selectedRouteIds: ["87", "88"],
    })

    const vehicle = vehicleFactory.build({ routeId: "89" })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTab],
      },
      State.selectVehicleFromNotification(vehicle)
    )

    const expectedState: State.State = {
      ...initialState,
      routeTabs: [routeTab],
      routeTabsToPush: null,
      selectedVehicleOrGhost: vehicle,
    }

    expect(newState).toMatchObject(expectedState)
  })

  test("createRouteTab", () => {
    const originalRouteTab1 = routeTabFactory.build({
      isCurrentTab: false,
      ordering: 4,
    })
    const originalRouteTab2 = routeTabFactory.build({
      isCurrentTab: true,
      ordering: 2,
    })
    const originalRouteTabs = [originalRouteTab1, originalRouteTab2]

    const newState = reducer(
      {
        ...initialState,
        routeTabs: originalRouteTabs,
      },
      State.createRouteTab()
    )

    const expectedNewTabs = [
      { ...originalRouteTab1 },
      { ...originalRouteTab2, isCurrentTab: false },
      {
        isCurrentTab: true,
        ordering: 5,
      },
    ]

    const expectedState = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toMatchObject(expectedState)
  })

  test("closeRouteTab", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 0,
      presetName: undefined,
      isCurrentTab: true,
    })
    const routeTab2 = routeTabFactory.build({
      uuid: "uuid2",
      ordering: 1,
      presetName: undefined,
      isCurrentTab: false,
    })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab1, routeTab2] },
      State.closeRouteTab("uuid2")
    )

    const expectedNewTabs = [routeTab1]
    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toEqual(expectedState)
  })

  test("createPreset", () => {
    const routeTab = routeTabFactory.build({
      uuid: "uuid",
      ordering: 0,
      presetName: undefined,
      isCurrentTab: true,
    })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab] },
      State.createPreset("uuid", "My Preset")
    )

    const expectedNewTabs = [{ ...routeTab, presetName: "My Preset" }]
    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toEqual(expectedState)
  })

  test("instantiatePreset", () => {
    const routeTab1 = routeTabFactory.build({
      uuid: "uuid1",
      ordering: 0,
      presetName: undefined,
      isCurrentTab: true,
      selectedRouteIds: ["1"],
    })

    const routeTab2 = routeTabFactory.build({
      uuid: "uuid2",
      ordering: undefined,
      presetName: "My Preset",
      isCurrentTab: false,
      selectedRouteIds: ["39"],
    })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab1, routeTab2] },
      State.instantiatePreset("uuid2")
    )

    const expectedNewTabs = [
      { ...routeTab1, isCurrentTab: false },
      { ...routeTab2, ordering: 1, isCurrentTab: true },
    ]
    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toEqual(expectedState)
  })

  test("savePreset", () => {
    const routeTab1 = routeTabFactory.build({
      uuid: "uuid1",
      ordering: undefined,
      presetName: "My Preset",
      isCurrentTab: false,
      selectedRouteIds: ["1"],
    })

    const routeTab2 = routeTabFactory.build({
      uuid: "uuid2",
      ordering: 0,
      presetName: "My Preset",
      isCurrentTab: true,
      selectedRouteIds: ["1", "39"],
      saveChangesToTabUuid: "uuid1",
    })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab1, routeTab2] },
      State.savePreset("uuid2")
    )

    const expectedNewTabs = [
      {
        ...routeTab1,
        ordering: 0,
        isCurrentTab: true,
        selectedRouteIds: ["1", "39"],
      },
    ]
    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toEqual(expectedState)
  })

  test("deletePreset", () => {
    const routeTab = routeTabFactory.build({
      ordering: 0,
      presetName: "My Preset",
      isCurrentTab: true,
    })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab] },
      State.deletePreset(routeTab.uuid)
    )

    const expectedNewTabs = [] as RouteTab[]
    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toEqual(expectedState)
  })

  test("selectRouteTab", () => {
    const routeTab1 = routeTabFactory.build()
    const routeTab2 = routeTabFactory.build({ isCurrentTab: true })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab1, routeTab2] },
      State.selectRouteTab(routeTab1.uuid)
    )

    const expectedNewTabs = [
      { ...routeTab1, isCurrentTab: true },
      { ...routeTab2, isCurrentTab: false },
    ]
    const expectedState: State.State = {
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    }

    expect(newState).toEqual(expectedState)
  })

  test("selectRouteInTab", () => {
    const routeTab1 = routeTabFactory.build({ isCurrentTab: true })
    const routeTab2 = routeTabFactory.build({ isCurrentTab: false })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTab1, routeTab2],
      },
      State.selectRouteInTab("1")
    )

    const expectedNewTabs = [
      { ...routeTab1, selectedRouteIds: ["1"] },
      routeTab2,
    ]
    expect(newState).toEqual({
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    })
  })

  test("deselectRouteInTab", () => {
    const routeTab1 = routeTabFactory.build({
      isCurrentTab: true,
      selectedRouteIds: ["1"],
    })
    const routeTab2 = routeTabFactory.build({ isCurrentTab: false })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTab1, routeTab2],
      },
      State.deselectRouteInTab("1")
    )

    const expectedNewTabs = [{ ...routeTab1, selectedRouteIds: [] }, routeTab2]

    expect(newState).toEqual({
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    })
  })

  test("flipLadderInTab", () => {
    const routeTab1 = routeTabFactory.build({
      isCurrentTab: true,
      selectedRouteIds: ["1"],
    })
    const routeTab2 = routeTabFactory.build({ isCurrentTab: false })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTab1, routeTab2],
      },
      State.flipLadderInTab("1")
    )

    const expectedNewTabs = [
      { ...routeTab1, ladderDirections: { "1": 1 } },
      routeTab2,
    ]
    expect(newState).toEqual({
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    })
  })

  test("toggleLadderCrowdingInTab", () => {
    const routeTab1 = routeTabFactory.build({
      isCurrentTab: true,
      selectedRouteIds: ["1"],
    })
    const routeTab2 = routeTabFactory.build({ isCurrentTab: false })

    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTab1, routeTab2],
      },
      State.toggleLadderCrowdingInTab("1")
    )

    const expectedNewTabs = [
      { ...routeTab1, ladderCrowdingToggles: { "1": true } },
      routeTab2,
    ]

    expect(newState).toEqual({
      ...initialState,
      routeTabs: expectedNewTabs,
      routeTabsToPush: expectedNewTabs,
    })
  })

  test("startingRouteTabsPush", () => {
    const newState = reducer(initialState, State.startingRouteTabsPush())
    expect(newState).toEqual({
      ...initialState,
      routeTabsPushInProgress: true,
    })
  })

  test("routeTabsPushComplete", () => {
    const newState = reducer(
      { ...initialState, routeTabsPushInProgress: true },
      State.routeTabsPushComplete()
    )
    expect(newState).toEqual({
      ...initialState,
      routeTabsPushInProgress: false,
    })
  })

  test("retryRouteTabsPushIfNotOutdated", () => {
    const firstPushRouteTabs = [routeTabFactory.build()]
    const secondPushRouteTabs = [...firstPushRouteTabs, routeTabFactory.build()]

    const stateWithoutQueuedTabs = {
      ...initialState,
      routeTabsPushInProgress: true,
      routeTabs: firstPushRouteTabs,
    }
    const stateWithQueuedTabs = {
      ...stateWithoutQueuedTabs,
      routeTabsToPush: secondPushRouteTabs,
      routeTabs: secondPushRouteTabs,
    }

    const newStateWithoutQueuedTabs = reducer(
      stateWithoutQueuedTabs,
      State.retryRouteTabsPushIfNotOutdated(firstPushRouteTabs)
    )
    const newStateWithQueuedTabs = reducer(
      stateWithQueuedTabs,
      State.retryRouteTabsPushIfNotOutdated(firstPushRouteTabs)
    )

    expect(newStateWithoutQueuedTabs).toEqual({
      ...stateWithoutQueuedTabs,
      routeTabsPushInProgress: false,
      routeTabsToPush: firstPushRouteTabs,
    })
    expect(newStateWithQueuedTabs).toEqual({
      ...stateWithQueuedTabs,
      routeTabsPushInProgress: false,
    })
  })

  test("closeInputModal", () => {
    const mockCallback = jest.fn()
    const stateWithInputModal = {
      ...initialState,
      openInputModal: {
        type: "DELETE_PRESET" as const,
        deleteCallback: mockCallback,
        presetName: "My Preset",
      },
    }

    const newState = reducer(stateWithInputModal, State.closeInputModal())

    expect(newState.openInputModal).toBeNull()
  })

  test("promptToSaveOrCreatePreset when creating", () => {
    const mockDispatch = jest.fn()
    const routeTab = routeTabFactory.build({ presetName: undefined })

    const newState = reducer(
      initialState,
      State.promptToSaveOrCreatePreset(routeTab)
    )

    switch (newState.openInputModal?.type) {
      case "CREATE_PRESET":
        newState.openInputModal.createCallback("Preset name", mockDispatch)
        expect(mockDispatch).toHaveBeenCalledWith(
          State.createPreset(routeTab.uuid, "Preset name")
        )
        newState.openInputModal.confirmOverwriteCallback(
          "Preset name",
          "uuid",
          mockDispatch
        )
        expect(mockDispatch).toHaveBeenCalledWith(
          State.promptToOverwritePreset("Preset name", routeTab, "uuid")
        )
        return
      default:
        fail("did not receive correct openInputModal type")
    }
  })

  test("promptToSaveOrCreatePreset when saving", () => {
    const mockDispatch = jest.fn()
    const routeTab = routeTabFactory.build({
      presetName: "My preset",
      saveChangesToTabUuid: "uuid2",
    })

    const newState = reducer(
      initialState,
      State.promptToSaveOrCreatePreset(routeTab)
    )

    switch (newState.openInputModal?.type) {
      case "SAVE_PRESET":
        newState.openInputModal.saveCallback(mockDispatch)
        expect(newState.openInputModal.presetName).toBe("My preset")
        expect(mockDispatch).toHaveBeenCalledWith(
          State.savePreset(routeTab.uuid)
        )
        return
      default:
        fail("did not receive correct openInputModal type")
    }
  })

  test("promptToSaveOrCreatePreset doesn't open a modal when there are no changes", () => {
    const routeTab = routeTabFactory.build({
      presetName: "My preset",
      saveChangesToTabUuid: undefined,
    })

    const newState = reducer(
      initialState,
      State.promptToSaveOrCreatePreset(routeTab)
    )

    expect(newState.openInputModal).toBeNull()
  })

  test("promptToDeletePreset", () => {
    const mockDispatch = jest.fn()
    const routeTab = routeTabFactory.build({
      presetName: "My preset",
    })

    const newState = reducer(initialState, State.promptToDeletePreset(routeTab))

    switch (newState.openInputModal?.type) {
      case "DELETE_PRESET":
        newState.openInputModal.deleteCallback(mockDispatch)
        expect(newState.openInputModal.presetName).toBe("My preset")
        expect(mockDispatch).toHaveBeenCalledWith(
          State.deletePreset(routeTab.uuid)
        )
        return
      default:
        fail("did not receive correct openInputModal type")
    }
  })

  test("promptToOverwritePreset", () => {
    const mockDispatch = jest.fn()
    const routeTab = routeTabFactory.build({ presetName: "My Preset" })

    const newState = reducer(
      initialState,
      State.promptToOverwritePreset("My Preset", routeTab, routeTab.uuid)
    )

    switch (newState.openInputModal?.type) {
      case "OVERWRITE_PRESET":
        newState.openInputModal.confirmCallback(mockDispatch)
        expect(newState.openInputModal.presetName).toBe("My Preset")
        expect(mockDispatch).toHaveBeenCalledWith(
          State.deletePreset(routeTab.uuid)
        )
        expect(mockDispatch).toHaveBeenCalledWith(
          State.createPreset(routeTab.uuid, "My Preset")
        )
        return
      default:
        fail("did not receive correct openInputModal type")
    }
  })
})
