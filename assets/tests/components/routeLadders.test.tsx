import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { LoadableTimepoints, Route, RouteId } from "../../src/skate"

const dispatch = () => undefined

test("renders a route ladder", () => {
  const routes: Route[] = [{ id: "1" }, { id: "28" }]
  const timepointsForRouteId = (routeId: RouteId): LoadableTimepoints => {
    switch (routeId) {
      case "1":
        return [{ id: "WASMA" }, { id: "MELWA" }, { id: "HHGAT" }]
      case "28":
        return [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]
      default:
        return null
    }
  }

  const tree = renderer
    .create(
      <RouteLadders
        routes={routes}
        dispatch={dispatch}
        timepointsForRouteId={timepointsForRouteId}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
