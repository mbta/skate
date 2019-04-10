import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRoute } from "../../src/skate"

const dispatch = () => undefined

test("renders a route ladder", () => {
  const routes: Route[] = [{ id: "1" }, { id: "28" }]
  const timepointsByRoute: TimepointsByRoute = {
    "1": [
      { id: "WASMA" },
      { id: "MELWA" },
      { id: "HHGAT" },
      { id: "MAPUT" },
      { id: "CNTSQ" },
      { id: "MIT" },
      { id: "HYNES" },
      { id: "MASTA" },
      { id: "DUDLY" },
    ],
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
      <RouteLadders
        routes={routes}
        dispatch={dispatch}
        timepointsByRoute={timepointsByRoute}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
