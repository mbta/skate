import { LadderDirection } from "../src/models/ladderDirection"
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

import vehicleFactory from "./factories/vehicle"
import routeTabFactory from "./factories/routeTab"

const initialState = State.initialState
const reducer = State.reducer

describe("reducer", () => {
  test("selectRoute", () => {
    const state = {
      ...initialState,
      selectedRouteIds: ["28"],
    }
    const expectedState = {
      ...state,
      selectedRouteIds: ["28", "39"],
    }
    const newState = reducer(state, State.selectRoute("39"))
    expect(newState).toEqual(expectedState)
  })

  test("deselectRoute", () => {
    const state = {
      ...initialState,
      selectedRouteIds: ["28", "39"],
    }
    const expectedState = {
      ...state,
      selectedRouteIds: ["28"],
    }
    const newState = reducer(state, State.deselectRoute("39"))
    expect(newState).toEqual(expectedState)
  })

  test("flipLadder", () => {
    const state = {
      ...initialState,
      ladderDirections: { route: LadderDirection.ZeroToOne },
    }
    const expectedState = {
      ...initialState,
      ladderDirections: { route: LadderDirection.OneToZero },
    }
    const newState = reducer(state, State.flipLadder("route"))
    expect(newState).toEqual(expectedState)
  })

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

  test("toggleLadderCrowdingForRoute", () => {
    const state = initialState

    const newState = reducer(state, State.toggleLadderCrowding("77"))
    const expectedState = { ...state, ladderCrowdingToggles: { "77": true } }

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

  test("toggleSwingsView enables swings view when other views are closed", () => {
    const expectedState: State.State = {
      ...initialState,
      openView: State.OpenView.Swings,
    }

    const newState = reducer(initialState, State.toggleSwingsView())

    expect(newState).toEqual(expectedState)
  })

  test("toggleSwingsView enables swings view when late view is open", () => {
    const expectedState: State.State = {
      ...initialState,
      openView: State.OpenView.Swings,
    }

    const newState = reducer(
      { ...initialState, openView: State.OpenView.Late },
      State.toggleSwingsView()
    )

    expect(newState).toEqual(expectedState)
  })

  test("toggleSwingsView disables swings view when swings view is open", () => {
    const newState = reducer(
      { ...initialState, openView: State.OpenView.Swings },
      State.toggleSwingsView()
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

  test("createRouteTab", () => {
    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTabFactory.build({ isCurrentTab: true })],
      },
      State.createRouteTab()
    )

    const expectedState: State.State = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build(),
        routeTabFactory.build({ isCurrentTab: true }),
      ],
    }

    expect(newState).toEqual(expectedState)
  })

  test("selectRouteTab", () => {
    const routeTab1 = routeTabFactory.build()
    const routeTab2 = routeTabFactory.build({ isCurrentTab: true })

    const newState = reducer(
      { ...initialState, routeTabs: [routeTab1, routeTab2] },
      State.selectRouteTab(0)
    )

    const expectedRouteTab1 = routeTabFactory.build({ isCurrentTab: true })
    const expectedRouteTab2 = routeTabFactory.build()

    const expectedState: State.State = {
      ...initialState,
      routeTabs: [expectedRouteTab1, expectedRouteTab2],
    }

    expect(newState).toEqual(expectedState)
  })

  test("selectRouteInTab", () => {
    const newState = reducer(
      {
        ...initialState,
        routeTabs: [routeTabFactory.build({ isCurrentTab: true })],
      },
      State.selectRouteInTab("1")
    )

    const expectedRouteTab = routeTabFactory.build({
      isCurrentTab: true,
      selectedRouteIds: ["1"],
    })

    expect(newState).toEqual({ ...initialState, routeTabs: [expectedRouteTab] })
  })

  test("deselectRouteInTab", () => {
    const newState = reducer(
      {
        ...initialState,
        routeTabs: [
          routeTabFactory.build({
            isCurrentTab: true,
            selectedRouteIds: ["1"],
          }),
        ],
      },
      State.deselectRouteInTab("1")
    )

    expect(newState).toEqual({
      ...initialState,
      routeTabs: [routeTabFactory.build({ isCurrentTab: true })],
    })
  })

  test("flipLadderInTab", () => {
    const newState = reducer(
      {
        ...initialState,
        routeTabs: [
          routeTabFactory.build({
            isCurrentTab: true,
            selectedRouteIds: ["1"],
          }),
        ],
      },
      State.flipLadderInTab("1")
    )

    expect(newState).toEqual({
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          isCurrentTab: true,
          selectedRouteIds: ["1"],
          ladderDirections: { "1": 1 },
        }),
      ],
    })
  })

  test("toggleLadderCrowdingInTab", () => {
    const newState = reducer(
      {
        ...initialState,
        routeTabs: [
          routeTabFactory.build({
            isCurrentTab: true,
            selectedRouteIds: ["1"],
          }),
        ],
      },
      State.toggleLadderCrowdingInTab("1")
    )

    expect(newState).toEqual({
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          isCurrentTab: true,
          selectedRouteIds: ["1"],
          ladderCrowdingToggles: { "1": true },
        }),
      ],
    })
  })
})
