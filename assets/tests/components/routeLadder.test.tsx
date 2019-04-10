import React from "react"
import renderer from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import { Route, TimepointsByRoute } from "../../src/skate"

const dispatch = () => undefined

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepointsByRoute: TimepointsByRoute = {
    "28": [
      { id: "MATPN" },
      { id: "WELLH" },
      { id: "MORTN" },
      { id: "HRUGG" },
      { id: "BLTAL" },
      { id: "ROXBS" },
      { id: "FRNPK" },
      { id: "GHALL" },
      { id: "LATAC" },
      { id: "WARWL" },
      { id: "DUDLY" },
      { id: "LOUIS" },
      { id: "MALCX" },
      { id: "RUGG" },
    ],
  }

  const tree = renderer
    .create(
      <RouteLadder
        route={route}
        dispatch={dispatch}
        timepointsByRoute={timepointsByRoute}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
