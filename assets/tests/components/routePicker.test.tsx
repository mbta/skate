import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import RoutePicker from "../../src/components/routePicker"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route, RouteId } from "../../src/skate"
import { deselectRoute, selectRoute } from "../../src/state"

test("renders a list of routes", () => {
  const routes: Route[] = [
    { id: "28" },
    { id: "39" },
    { id: "71" },
    { id: "73" },
    { id: "111" },
  ]
  const selectedRouteIds: RouteId[] = ["28", "39"]

  const tree = renderer
    .create(<RoutePicker routes={routes} selectedRouteIds={selectedRouteIds} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders a loading/empty state", () => {
  const tree = renderer
    .create(<RoutePicker routes={null} selectedRouteIds={[]} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("clicking a route selects it", () => {
  const mockDispatch = jest.fn()
  const routes = [{ id: "id" }]

  const routePicker = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RoutePicker routes={routes} selectedRouteIds={[]} />
    </DispatchProvider>
  )

  routePicker
    .find(".m-route-picker__route-list-button--deselected")
    .first()
    .simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(selectRoute("id"))
})

test("clicking a selected route deselects it", () => {
  const mockDispatch = jest.fn()
  const routes = [{ id: "id" }]

  const routePicker = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RoutePicker routes={routes} selectedRouteIds={["id"]} />
    </DispatchProvider>
  )

  routePicker
    .find(".m-route-picker__route-list-button--selected")
    .first()
    .simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("id"))
})

test("clicking in the list of selected routes deselects a route", () => {
  const mockDispatch = jest.fn()
  const routes = [{ id: "id" }]

  const routePicker = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RoutePicker routes={routes} selectedRouteIds={["id"]} />
    </DispatchProvider>
  )

  routePicker
    .find(".m-route-picker__selected-routes-button")
    .first()
    .simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("id"))
})
