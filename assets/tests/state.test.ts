import { LadderDirection } from "../src/models/ladderDirection"
import { NotificationReason, VehicleId } from "../src/realtime.d"
import { VehicleLabelSetting } from "../src/settings"
import * as State from "../src/state"

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
    const vehicleId: VehicleId = "v1"
    const state = initialState
    const expectedState = {
      ...state,
      selectedVehicleId: vehicleId,
    }

    const newState = reducer(state, State.selectVehicle(vehicleId))

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

  test("setLadderVehicleLabelSetting", () => {
    const ladderVehicleLabel: VehicleLabelSetting =
      VehicleLabelSetting.VehicleNumber
    const state = initialState
    const expectedState = {
      ...state,
      settings: {
        ...state.settings,
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
      settings: {
        ...state.settings,
        shuttleVehicleLabel,
      },
    }

    const newState = reducer(
      state,
      State.setShuttleVehicleLabelSetting(shuttleVehicleLabel)
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
      id: 123,
      createdAt: new Date(),
      tripIds: ["123", "456", "789"],
      reason: "other" as NotificationReason,
      routeIds: [],
      runIds: [],
      operatorName: null,
      operatorId: null,
      routeIdAtCreation: null,
      startTime: new Date(),
    }
    const state = { ...initialState, selectedNotificationIsLoading: true }
    const newState = reducer(state, State.setNotification(notification))
    const expectedState = {
      ...state,
      selectedNotification: notification,
      selectedNotificationIsLoading: false,
    }
    expect(newState).toEqual(expectedState)
  })

  test("setNotificationIsInactive", () => {
    const state = { ...initialState, selectedNotificationIsLoading: true }
    const newState = reducer(state, State.setNotificationIsInactive())
    const expectedState = {
      ...state,
      selectedNotificationIsInactive: true,
      selectedNotificationIsLoading: false,
    }
    expect(newState).toEqual(expectedState)
  })

  test("setNotificationIsLoading", () => {
    const state = initialState
    const newState = reducer(state, State.setNotificationIsLoading(true))
    const expectedState = {
      ...state,
      selectedNotificationIsLoading: true,
    }
    expect(newState).toEqual(expectedState)
  })
})
