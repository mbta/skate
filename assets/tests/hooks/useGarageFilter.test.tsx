import { act, renderHook } from "@testing-library/react-hooks"
import { mount } from "enzyme"
import React from "react"
import routeFactory from "../factories/route"
import {
  GarageFilter,
  useGarageFilter,
  filterRoutesByGarage,
  GarageFilterData,
} from "../../src/hooks/useGarageFilter"

describe("useGarageFilter", () => {
  test("defaults to no garages selected", () => {
    const routes = [routeFactory.build()]

    // tslint:disable-next-line: react-hooks-nesting no-empty
    const { result } = renderHook(() => useGarageFilter(routes))

    expect(result.current.filteredGarages).toEqual([])
  })

  test("includes list of garages in data", () => {
    const routes = [routeFactory.build({ garages: ["Garage A"] })]

    // tslint:disable-next-line: react-hooks-nesting no-empty
    const { result } = renderHook(() => useGarageFilter(routes))

    expect(result.current.allGarages).toEqual(["Garage A"])
  })

  test("toggleGarage selects and deselects garage", () => {
    const routes = [routeFactory.build({ garages: ["Garage A"] })]

    // tslint:disable-next-line: react-hooks-nesting no-empty
    const { result } = renderHook(() => useGarageFilter(routes))

    const testEvent = {
      currentTarget: {
        value: "Garage A",
      },
    } as React.ChangeEvent<HTMLInputElement>

    act(() => result.current.toggleGarage(testEvent))

    expect(result.current.filteredGarages).toEqual(["Garage A"])

    act(() => result.current.toggleGarage(testEvent))

    expect(result.current.filteredGarages).toEqual([])
  })
})

describe("filterRoutesByGarage", () => {
  test("returns all routes when no garages selected", () => {
    const route1 = routeFactory.build({ garages: ["Garage A"] })
    const route2 = routeFactory.build({ garages: ["Garage B"] })

    // tslint:disable-next-line: react-hooks-nesting no-empty
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

    // tslint:disable-next-line: react-hooks-nesting no-empty
    const { result } = renderHook(() => useGarageFilter([route1, route2]))

    const testEvent = {
      currentTarget: {
        value: "Garage A",
      },
    } as React.ChangeEvent<HTMLInputElement>

    act(() => result.current.toggleGarage(testEvent))

    const filteredRoutes = filterRoutesByGarage(
      [route1, route2],
      result.current
    )

    expect(filteredRoutes.length).toEqual(1)
    expect(filteredRoutes).toContain(route1)
  })
})

describe("GarageFilter", () => {
  test("clicking a checkbox updates the garage filter", () => {
    const mockGarageFilter: GarageFilterData = {
      filteredGarages: [],
      allGarages: ["Garage A", "Garage B"],
      toggleGarage: jest.fn(),
    }

    const garageFilter = mount(<GarageFilter {...mockGarageFilter} />)

    const testEvent = {
      currentTarget: {
        value: "Garage A",
      },
    } as React.ChangeEvent<HTMLSelectElement>

    garageFilter
      .find(".m-garage-filter__input")
      .first()
      .simulate("change", testEvent)

    expect(mockGarageFilter.toggleGarage).toHaveBeenCalled()
  })

  test("can hide / show the filters", () => {
    const mockGarageFilter: GarageFilterData = {
      filteredGarages: [],
      allGarages: ["Garage A", "Garage B"],
      toggleGarage: jest.fn(),
    }

    const garageFilter = mount(<GarageFilter {...mockGarageFilter} />)

    expect(garageFilter.text().includes("Garage A")).toBeTruthy()

    garageFilter
      .find(".m-garage-filter__show-hide-button")
      .first()
      .simulate("click")

    expect(garageFilter.text().includes("Garage A")).toBeFalsy()

    garageFilter
      .find(".m-garage-filter__show-hide-button")
      .first()
      .simulate("click")

    expect(garageFilter.text().includes("Garage A")).toBeTruthy()
  })
})
