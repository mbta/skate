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

// tslint:disable: react-hooks-nesting no-empty

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

  test("handleGarageToggle selects and deselects garage", () => {
    const routes = [routeFactory.build({ garages: ["Garage A"] })]

    const { result } = renderHook(() => useGarageFilter(routes))

    const testEvent = {
      currentTarget: {
        value: "Garage A",
      },
    } as React.ChangeEvent<HTMLInputElement>

    act(() => result.current.handleGarageToggle(testEvent))

    expect(result.current.filteredGarages).toEqual(["Garage A"])

    act(() => result.current.handleGarageToggle(testEvent))

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

    const testEvent = {
      currentTarget: {
        value: "Garage A",
      },
    } as React.ChangeEvent<HTMLInputElement>

    act(() => result.current.handleGarageToggle(testEvent))

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
      handleGarageToggle: jest.fn(),
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

    expect(mockGarageFilter.handleGarageToggle).toHaveBeenCalled()
  })
})
