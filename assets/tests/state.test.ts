import { Vehicle } from "../src/skate"
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

  test("selectVehicle", () => {
    const vehicle: Vehicle = {
      id: "v1",
      label: "v1-label",
      timestamp: 123,
      direction_id: 0,
      route_id: "r1",
      trip_id: "t1",
      stop_status: {
        status: "in_transit_to",
        stop_id: "s1",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "tp1",
        percent_of_the_way_to_timepoint: 50,
      },
    }
    const state = initialState
    const expectedState = {
      ...state,
      selectedVehicle: vehicle,
    }

    const newState = reducer(state, State.selectVehicle(vehicle))

    expect(newState).toEqual(expectedState)
  })

  test("deselectVehicle", () => {
    const initialVehicle: Vehicle = {
      id: "v1",
      label: "v1-label",
      timestamp: 123,
      direction_id: 0,
      route_id: "r1",
      trip_id: "t1",
      stop_status: {
        status: "in_transit_to",
        stop_id: "s1",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "tp1",
        percent_of_the_way_to_timepoint: 50,
      },
    }
    const state = {
      ...initialState,
      selectVehicle: initialVehicle,
    }
    const expectedState = {
      ...state,
      selectedVehicle: undefined,
    }

    const newState = reducer(state, State.deselectVehicle())

    expect(newState).toEqual(expectedState)
  })
})
