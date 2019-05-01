import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route } from "../../src/skate"
import { deselectRoute } from "../../src/state"

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepointIds = ["MATPN", "WELLH", "MORTN"]

  const tree = renderer
    .create(
      <RouteLadder route={route} timepointIds={timepointIds} vehicles={[]} />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("displays loading if we are fetching the timepoints", () => {
  const route: Route = { id: "28" }
  const timepointIds = null

  const tree = renderer
    .create(
      <RouteLadder route={route} timepointIds={timepointIds} vehicles={[]} />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("clicking the close button deselects that route", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepointIds = ["MATPN", "WELLH", "MORTN"]

  const wrapper = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RouteLadder route={route} timepointIds={timepointIds} vehicles={[]} />
    </DispatchProvider>
  )
  wrapper.find(".m-route-ladder__close").simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
})
