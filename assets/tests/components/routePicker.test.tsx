import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import RoutePicker from "../../src/components/routePicker"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Route, RouteId } from "../../src/schedule.d"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

describe("RoutePicker", () => {
  test("renders a list of routes and presets toggle", () => {
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

  test("clicking a route selects it", async () => {
    const mockSelect = jest.fn()

    const routes = [routeFactory.build({ id: "id", name: "test route" })]

    const result = render(
      <RoutesProvider routes={routes}>
        <RoutePicker
          selectedRouteIds={[]}
          selectRoute={mockSelect}
          deselectRoute={jest.fn()}
        />
      </RoutesProvider>
    )

    await userEvent.click(result.getByRole("button", { name: /test route/ }))

    expect(mockSelect).toHaveBeenCalledWith("id")
  })

  test("clicking in the list of selected routes deselects a route", async () => {
    const mockDeselect = jest.fn()

    const result = render(
      <RoutePicker
        selectedRouteIds={["id"]}
        selectRoute={jest.fn()}
        deselectRoute={mockDeselect}
      />
    )

    await userEvent.click(result.getByRole("button", { name: /id/ }))

    expect(mockDeselect).toHaveBeenCalledWith("id")
  })
})
