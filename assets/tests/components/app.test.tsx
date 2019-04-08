import React from "react"
import renderer from "react-test-renderer"
import App, { reducer, setRoutes } from "../../src/components/app"
import { Route } from "../../src/skate"

it("renders", () => {
  const tree = renderer.create(<App />).toJSON()

  expect(tree).toMatchSnapshot()
})

describe("reducer", () => {
  it("handles setRoutes by setting list of stops", () => {
    const routes: Route[] = [{ id: "1" }, { id: "2" }, { id: "3" }]
    const initialState = {
      routes: null,
    }
    const expectedState = {
      routes,
    }

    const newState = reducer(initialState, setRoutes(routes))

    expect(newState).toEqual(expectedState)
  })
})
