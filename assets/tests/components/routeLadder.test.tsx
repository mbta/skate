import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route } from "../../src/skate"
import { deselectRoute } from "../../src/state"

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const tree = renderer
    .create(<RouteLadder route={route} timepoints={timepoints} vehicles={[]} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("displays loading if we are fetching the timepoints", () => {
  const route: Route = { id: "28" }
  const timepoints = null

  const tree = renderer
    .create(<RouteLadder route={route} timepoints={timepoints} vehicles={[]} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("clicking the close button deselects that route", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const wrapper = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RouteLadder route={route} timepoints={timepoints} vehicles={[]} />
    </DispatchProvider>
  )
  wrapper.find(".m-route-ladder__close").simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
})
