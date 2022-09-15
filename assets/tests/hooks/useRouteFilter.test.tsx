import { act, renderHook } from "@testing-library/react-hooks"
import React from "react"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../../src/hooks/useRouteFilter"
import routeFactory from "../factories/route"
import { Route } from "../../src/schedule.d"
import userEvent from "@testing-library/user-event"
import { render } from "@testing-library/react"

describe("useRouteFilter", () => {
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
  test("filters by route name, case insensitively", () => {
    const initialRoutes: Route[] = [
      routeFactory.build({ id: "3", name: "3" }),
      routeFactory.build({ id: "12", name: "12" }),
      routeFactory.build({ id: "13", name: "13" }),
      routeFactory.build({ id: "743", name: "SL3" }),
    ]

    const filteredRoutes1 = filterRoutes(initialRoutes, {
      filterText: "Sl",
    })

    expect(filteredRoutes1).toEqual([
      routeFactory.build({ id: "743", name: "SL3" }),
    ])

    const filteredRoutes2 = filterRoutes(initialRoutes, {
      filterText: "7",
    })

    expect(filteredRoutes2).toEqual([])
  })
})

describe("RouteFilter", () => {
  test("inputting filter text updates the route filter", async () => {
    const mockRouteFilter: RouteFilterData = {
      filterText: "",
      handleTextInput: jest.fn(),
      clearTextInput: jest.fn(),
    }
    const result = render(<RouteFilter {...mockRouteFilter} />)

    await userEvent.type(
      result.getByPlaceholderText("Search routes"),
      "test input"
    )

    expect(mockRouteFilter.handleTextInput).toHaveBeenCalled()
  })

  test("the clear button clears the filter text", async () => {
    const mockRouteFilter: RouteFilterData = {
      filterText: "28",
      handleTextInput: jest.fn(),
      clearTextInput: jest.fn(),
    }
    const result = render(<RouteFilter {...mockRouteFilter} />)

    await userEvent.click(result.getByTestId("clear-text"))

    expect(mockRouteFilter.clearTextInput).toHaveBeenCalled()
  })
})
