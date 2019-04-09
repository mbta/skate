import { Route } from "../src/skate.d"
import * as State from "../src/state"

const initialState = State.initialState
const reducer = State.reducer

describe("reducer", () => {
  test("setRoutes", () => {
    const routes: Route[] = [{ id: "1" }, { id: "2" }, { id: "3" }]
    const state = {
      ...initialState,
      routes: null,
    }
    const expectedState = {
      ...state,
      routes,
    }
    const newState = reducer(state, State.setRoutes(routes))
    expect(newState).toEqual(expectedState)
  })

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
})
