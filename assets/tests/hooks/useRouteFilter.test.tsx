import { act, renderHook } from "@testing-library/react-hooks"
import { mount } from "enzyme"
import React from "react"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../../src/hooks/useRouteFilter"
import { Route } from "../../src/schedule.d"

// tslint:disable: react-hooks-nesting no-empty

describe("useRouteFilter", () => {
  test("defaults filter type to 'name'", () => {
    const { result } = renderHook(() => useRouteFilter())

    expect(result.current.filterType).toBe("name")
  })

  test("defaults filter text to empty string", () => {
    const { result } = renderHook(() => useRouteFilter())

    expect(result.current.filterText).toBe("")
  })

  test("handleTextInput changes the filterText", () => {
    const { result } = renderHook(() => useRouteFilter())
    expect(result.current.filterText).toBe("")

    const testEvent = {
      currentTarget: {
        value: "test input",
      },
    } as React.ChangeEvent<HTMLInputElement>
    act(() => result.current.handleTextInput(testEvent))

    expect(result.current.filterText).toBe("test input")
  })

  test("clearTextInput sets filterText to an empty string", () => {
    const { result } = renderHook(() => useRouteFilter())

    const testEvent = {
      currentTarget: {
        value: "test input",
      },
    } as React.ChangeEvent<HTMLInputElement>
    act(() => result.current.handleTextInput(testEvent))
    expect(result.current.filterText).toBe("test input")

    act(() => result.current.clearTextInput())

    expect(result.current.filterText).toBe("")
  })
})

describe("filterRoutes", () => {
  test("when filter type is name, filters by route name, case insensitively", () => {
    const initialRoutes: Route[] = [
      { id: "3", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "3" },
      { id: "12", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "12" },
      { id: "13", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "13" },
      {
        id: "743",
        directionNames: { 0: "Outbound", 1: "Inbound" },
        name: "SL3",
      },
    ]

    const filteredRoutes1 = filterRoutes(initialRoutes, {
      filterType: "name",
      filterText: "Sl",
    })

    expect(filteredRoutes1).toEqual([
      {
        id: "743",
        directionNames: { 0: "Outbound", 1: "Inbound" },
        name: "SL3",
      },
    ])

    const filteredRoutes2 = filterRoutes(initialRoutes, {
      filterType: "name",
      filterText: "7",
    })

    expect(filteredRoutes2).toEqual([])
  })
})

describe("RouteFilter", () => {
  test("changing the filter type updates the route filter", () => {
    const mockRouteFilter: RouteFilterData = {
      filterType: "name",
      filterText: "",
      handleTypeChange: jest.fn(),
      handleTextInput: jest.fn(),
      clearTextInput: jest.fn(),
    }
    const routePicker = mount(<RouteFilter {...mockRouteFilter} />)

    const testEvent = {
      currentTarget: {
        value: "new-type",
      },
    } as React.ChangeEvent<HTMLSelectElement>
    routePicker.find(".m-route-filter__type").simulate("change", testEvent)

    expect(mockRouteFilter.handleTypeChange).toHaveBeenCalled()
  })

  test("inputting filter text updates the route filter", () => {
    const mockRouteFilter: RouteFilterData = {
      filterType: "name",
      filterText: "",
      handleTypeChange: jest.fn(),
      handleTextInput: jest.fn(),
      clearTextInput: jest.fn(),
    }
    const routePicker = mount(<RouteFilter {...mockRouteFilter} />)

    const testEvent = {
      currentTarget: {
        value: "test input",
      },
    } as React.ChangeEvent<HTMLInputElement>
    routePicker.find(".m-route-filter__input").simulate("change", testEvent)

    expect(mockRouteFilter.handleTextInput).toHaveBeenCalled()
  })

  test("the clear button clears the filter text", () => {
    const mockRouteFilter: RouteFilterData = {
      filterType: "name",
      filterText: "",
      handleTypeChange: jest.fn(),
      handleTextInput: jest.fn(),
      clearTextInput: jest.fn(),
    }
    const routePicker = mount(<RouteFilter {...mockRouteFilter} />)

    routePicker.find(".m-route-filter__clear").simulate("click")

    expect(mockRouteFilter.clearTextInput).toHaveBeenCalled()
  })
})
