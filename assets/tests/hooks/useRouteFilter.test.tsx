import { mount } from "enzyme"
import React from "react"
import { act, renderHook } from "react-hooks-testing-library"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../../src/hooks/useRouteFilter"
import { Route } from "../../src/schedule.d"

// tslint:disable: react-hooks-nesting no-empty

describe("useRouteFilter", () => {
  test("defaults filter type to 'id'", () => {
    const { result } = renderHook(() => useRouteFilter())

    expect(result.current.filterType).toBe("id")
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
  test("when filter type is id, filters by route IDs", () => {
    const initialRoutes: Route[] = [
      { id: "3", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "12", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "13", directionNames: { 0: "Outbound", 1: "Inbound" } },
    ]

    const filteredRoutes = filterRoutes(initialRoutes, {
      filterType: "id",
      filterText: "3",
    })

    expect(filteredRoutes).toEqual([
      { id: "3", directionNames: { 0: "Outbound", 1: "Inbound" } },
      { id: "13", directionNames: { 0: "Outbound", 1: "Inbound" } },
    ])
  })
})

describe("RouteFilter", () => {
  test("changing the filter type updates the route filter", () => {
    const mockRouteFilter: RouteFilterData = {
      filterType: "id",
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
      filterType: "id",
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
      filterType: "id",
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
