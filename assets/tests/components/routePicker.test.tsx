import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import RoutePicker from "../../src/components/routePicker"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Route, RouteId } from "../../src/schedule.d"
import { deselectRoute, initialState, selectRoute } from "../../src/state"

describe("RoutePicker", () => {
  test("renders a list of routes", () => {
    const routes: Route[] = [
      routeFactory.build({ id: "28", name: "28" }),
      routeFactory.build({ id: "39", name: "39" }),
      routeFactory.build({ id: "71", name: "71" }),
      routeFactory.build({ id: "73", name: "73" }),
      routeFactory.build({ id: "111", name: "111" }),
      routeFactory.build({ id: "741", name: "SL1" }),
    ]

    const selectedRouteIds: RouteId[] = ["28", "39"]

    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <RoutePicker selectedRouteIds={selectedRouteIds} />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a loading/empty state", () => {
    const tree = renderer.create(<RoutePicker selectedRouteIds={[]} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a route selects it", () => {
    const mockDispatch = jest.fn()

    const routes = [routeFactory.build({ id: "id", name: "id" })]

    const routePicker = mount(
      <RoutesProvider routes={routes}>
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <RoutePicker selectedRouteIds={[]} />
        </StateDispatchProvider>
      </RoutesProvider>
    )

    routePicker
      .find(".m-route-picker__route-list-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectRoute("id"))
  })

  test("clicking a selected route deselects it", () => {
    const mockDispatch = jest.fn()

    const routes = [routeFactory.build({ id: "id", name: "id" })]

    const routePicker = mount(
      <RoutesProvider routes={routes}>
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <RoutePicker selectedRouteIds={["id"]} />
        </StateDispatchProvider>
      </RoutesProvider>
    )

    routePicker
      .find(".m-route-picker__route-list-button--selected")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("id"))
  })

  test("clicking in the list of selected routes deselects a route", () => {
    const mockDispatch = jest.fn()

    const routePicker = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RoutePicker selectedRouteIds={["id"]} />
      </StateDispatchProvider>
    )

    routePicker
      .find(".m-route-picker__selected-routes-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("id"))
  })
})
