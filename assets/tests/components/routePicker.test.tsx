import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import RoutePicker from "../../src/components/routePicker"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Route, RouteId } from "../../src/schedule.d"
import {
  deselectRoute,
  initialState,
  selectRoute,
  toggleRoutePicker,
} from "../../src/state"

describe("RoutePicker", () => {
  test("renders a list of routes", () => {
    const routes: Route[] = [
      { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "39", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "71", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "73", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "111", directionNames: { 0: "Outbound", 1: "Inbound" } },
    ]
    const selectedRouteIds: RouteId[] = ["28", "39"]

    const tree = renderer
      .create(
        <RoutePicker
          isVisible={true}
          routes={routes}
          selectedRouteIds={selectedRouteIds}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a loading/empty state", () => {
    const tree = renderer
      .create(
        <RoutePicker isVisible={true} routes={null} selectedRouteIds={[]} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking the collapse button hides the route picker", () => {
    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RoutePicker isVisible={true} routes={null} selectedRouteIds={[]} />
      </StateDispatchProvider>
    )
    expect(wrapper.find(".m-route-picker").hasClass("visible")).toBeTruthy()
    expect(wrapper.find(".m-route-picker").hasClass("hiddden")).toBeFalsy()

    wrapper
      .find(".m-route-picker__tab-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(toggleRoutePicker())
  })

  test("clicking a route selects it", () => {
    const mockDispatch = jest.fn()
    const routes = [
      { id: "id", directionNames: { 0: "Outbound", 1: "Inbound" } },
    ]

    const routePicker = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RoutePicker isVisible={true} routes={routes} selectedRouteIds={[]} />
      </StateDispatchProvider>
    )

    routePicker
      .find(".m-route-picker__route-list-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectRoute("id"))
  })

  test("clicking a selected route deselects it", () => {
    const mockDispatch = jest.fn()
    const routes = [
      { id: "id", directionNames: { 0: "Outbound", 1: "Inbound" } },
    ]

    const routePicker = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RoutePicker
          isVisible={true}
          routes={routes}
          selectedRouteIds={["id"]}
        />
      </StateDispatchProvider>
    )

    routePicker
      .find(".m-route-picker__route-list-button--selected")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("id"))
  })

  test("clicking in the list of selected routes deselects a route", () => {
    const mockDispatch = jest.fn()
    const routes = [
      { id: "id", directionNames: { 0: "Outbound", 1: "Inbound" } },
    ]

    const routePicker = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RoutePicker
          isVisible={true}
          routes={routes}
          selectedRouteIds={["id"]}
        />
      </StateDispatchProvider>
    )

    routePicker
      .find(".m-route-picker__selected-routes-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("id"))
  })
})
