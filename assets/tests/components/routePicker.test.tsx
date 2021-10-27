import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import RoutePicker from "../../src/components/routePicker"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Route, RouteId } from "../../src/schedule.d"

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
          <RoutePicker
            selectedRouteIds={selectedRouteIds}
            // tslint:disable-next-line: no-empty
            selectRoute={() => {}}
            // tslint:disable-next-line: no-empty
            deselectRoute={() => {}}
          />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a loading/empty state", () => {
    const tree = renderer
      .create(
        <RoutePicker
          selectedRouteIds={[]}
          // tslint:disable-next-line: no-empty
          selectRoute={() => {}}
          // tslint:disable-next-line: no-empty
          deselectRoute={() => {}}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a route selects it", () => {
    const mockSelect = jest.fn()

    const routes = [routeFactory.build({ id: "id", name: "id" })]

    const routePicker = mount(
      <RoutesProvider routes={routes}>
        <RoutePicker
          selectedRouteIds={[]}
          selectRoute={mockSelect}
          // tslint:disable-next-line: no-empty
          deselectRoute={() => {}}
        />
      </RoutesProvider>
    )

    routePicker
      .find(".m-route-picker__route-list-button")
      .first()
      .simulate("click")

    expect(mockSelect).toHaveBeenCalledWith("id")
  })

  test("clicking a selected route deselects it", () => {
    const mockDeselect = jest.fn()

    const routes = [routeFactory.build({ id: "id", name: "id" })]

    const routePicker = mount(
      <RoutesProvider routes={routes}>
        <RoutePicker
          selectedRouteIds={["id"]}
          // tslint:disable-next-line: no-empty
          selectRoute={() => {}}
          deselectRoute={mockDeselect}
        />
      </RoutesProvider>
    )

    routePicker
      .find(".m-route-picker__route-list-button--selected")
      .first()
      .simulate("click")

    expect(mockDeselect).toHaveBeenCalledWith("id")
  })

  test("clicking in the list of selected routes deselects a route", () => {
    const mockDeselect = jest.fn()

    const routePicker = mount(
      <RoutePicker
        selectedRouteIds={["id"]}
        // tslint:disable-next-line: no-empty
        selectRoute={() => {}}
        deselectRoute={mockDeselect}
      />
    )

    routePicker
      .find(".m-route-picker__selected-routes-button")
      .first()
      .simulate("click")

    expect(mockDeselect).toHaveBeenCalledWith("id")
  })
})
