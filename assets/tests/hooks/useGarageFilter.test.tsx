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
import { tagManagerEvent } from "../../src/helpers/googleTagManager"

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
      .find(".m-garage-filter__garage > button")
      .first()
      .simulate("click")

    expect(mockGarageFilter.toggleGarage).toHaveBeenCalled()
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User filtered routes by garage"
    )
    expect(tagManagerEvent).toHaveBeenCalledWith("filtered_routes_by_garage")
  })

  test("can hide / show the filters", () => {
    const mockGarageFilter: GarageFilterData = {
      filteredGarages: [],
      allGarages: ["Garage A", "Garage B"],
      toggleGarage: jest.fn(),
    }

    const garageFilter = mount(<GarageFilter {...mockGarageFilter} />)

    expect(garageFilter.text().includes("Garage A")).toBeFalsy()

    garageFilter
      .find(".m-garage-filter__show-hide-button")
      .first()
      .simulate("click")

    expect(garageFilter.text().includes("Garage A")).toBeTruthy()

    garageFilter
      .find(".m-garage-filter__show-hide-button")
      .first()
      .simulate("click")

    expect(garageFilter.text().includes("Garage A")).toBeFalsy()
  })
})
