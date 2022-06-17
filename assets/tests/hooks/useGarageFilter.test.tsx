import { act, renderHook } from "@testing-library/react-hooks"
import { mount } from "enzyme"
import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import routeFactory from "../factories/route"
import {
  GarageFilter,
  useGarageFilter,
  filterRoutesByGarage,
  GarageFilterData,
} from "../../src/hooks/useGarageFilter"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { BrowserRouter } from "react-router-dom"
import { 
  initialState,
  toggleShowGaragesFilter 
} from "../../src/state"

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

describe("useGarageFilter", () => {
  test("defaults to no garages selected", () => {
    const routes = [routeFactory.build()]

    const { result } = renderHook(() => useGarageFilter(routes))

    expect(result.current.filteredGarages).toEqual([])
  })

  test("includes list of garages in data", () => {
    const routes = [routeFactory.build({ garages: ["Garage A"] })]

    const { result } = renderHook(() => useGarageFilter(routes))

    expect(result.current.allGarages).toEqual(["Garage A"])
  })

  test("toggleGarage selects and deselects garage", () => {
    const routes = [routeFactory.build({ garages: ["Garage A"] })]

    const { result } = renderHook(() => useGarageFilter(routes))

    act(() => result.current.toggleGarage("Garage A"))

    expect(result.current.filteredGarages).toEqual(["Garage A"])

    act(() => result.current.toggleGarage("Garage A"))

    expect(result.current.filteredGarages).toEqual([])
  })
})

describe("filterRoutesByGarage", () => {
  test("returns all routes when no garages selected", () => {
    const route1 = routeFactory.build({ garages: ["Garage A"] })
    const route2 = routeFactory.build({ garages: ["Garage B"] })

    const { result } = renderHook(() => useGarageFilter([route1, route2]))

    const filteredRoutes = filterRoutesByGarage(
      [route1, route2],
      result.current
    )

    expect(filteredRoutes.length).toEqual(2)
    expect(filteredRoutes).toContain(route1)
    expect(filteredRoutes).toContain(route2)
  })

  test("filters by specified garage", () => {
    const route1 = routeFactory.build({ garages: ["Garage A"] })
    const route2 = routeFactory.build({ garages: ["Garage B"] })

    const { result } = renderHook(() => useGarageFilter([route1, route2]))

    act(() => result.current.toggleGarage("Garage A"))

    const filteredRoutes = filterRoutesByGarage(
      [route1, route2],
      result.current
    )

    expect(filteredRoutes.length).toEqual(1)
    expect(filteredRoutes).toContain(route1)
  })
})

describe("GarageFilter", () => {
  test("clicking a button updates the garage filter", () => {
    const originalFS = window.FS
    window.FS = { event: jest.fn(), identify: jest.fn() }
    afterEach(() => {
      window.FS = originalFS
    })

    const mockGarageFilter: GarageFilterData = {
      filteredGarages: [],
      allGarages: ["Garage A", "Garage B"],
      toggleGarage: jest.fn(),
    }

    const garageFilter = mount(<GarageFilter {...mockGarageFilter} />)

    garageFilter
      .find(".m-garage-filter__show-hide-button")
      .first()
      .simulate("click")

    garageFilter
      .find(".m-garage-filter__button")
      .first()
      .simulate("click")

    expect(mockGarageFilter.toggleGarage).toHaveBeenCalled()
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User filtered routes by garage"
    )
    expect(tagManagerEvent).toHaveBeenCalledWith("filtered_routes_by_garage")
  })

  test("can hide / show the filters", async () => {

    const dispatch = jest.fn()

    const user = userEvent.setup()

    const mockGarageFilter: GarageFilterData = {
      filteredGarages: [],
      allGarages: ["Garage A", "Garage B"],
      toggleGarage: jest.fn(),
    }

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <GarageFilter {...mockGarageFilter} />
        </BrowserRouter>
      </StateDispatchProvider>
    )  

    expect(result.getByTitle("Toggle Garage Filter")).toBeTruthy();
    expect(result.getByTitle("Garage A")).toBeFalsy();

    await user.click(result.getByTitle("Toggle Garage Filter"))
    expect(dispatch).toHaveBeenCalledWith(toggleShowGaragesFilter())

    expect(result.getByText("Garage A")).toBeTruthy()

    await user.click(result.getByTestId("m-garage-filter__show-hide-button"))
    expect(dispatch).toHaveBeenCalledWith(toggleShowGaragesFilter())
    expect(result.getByText("Garage A")).toBeFalsy()
  })
})
