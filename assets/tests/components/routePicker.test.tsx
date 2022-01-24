import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import RoutePicker from "../../src/components/routePicker"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Route, RouteId } from "../../src/schedule.d"
import featureIsEnabled from "../../src/laboratoryFeatures"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

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
            selectRoute={jest.fn()}
            deselectRoute={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a list of routes with tabs / presets enabled", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)

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
            selectRoute={jest.fn()}
            deselectRoute={jest.fn()}
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
          selectRoute={jest.fn()}
          deselectRoute={jest.fn()}
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
          deselectRoute={jest.fn()}
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
          selectRoute={jest.fn()}
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
        selectRoute={jest.fn()}
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
