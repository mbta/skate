import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import SearchResultsByProperty from "../../../src/components/mapPage/searchResultsByProperty"
import { useLimitedSearchResults } from "../../../src/hooks/useSearchResults"
import vehicleFactory from "../../factories/vehicle"
import { SearchProperty } from "../../../src/models/searchQuery"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import stateFactory from "../../factories/applicationState"
import { searchPageStateFactory } from "../../factories/searchPageState"

jest.mock("../../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  useLimitedSearchResults: jest.fn(() => null),
}))

afterEach(() => {
  jest.resetAllMocks()
})

const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()
const vehicleMatch = vehicleFactory.build()

describe("searchResultsByProperty", () => {
  test("Includes only sections that have results", () => {
    ;(useLimitedSearchResults as jest.Mock).mockImplementation(
      (
        _socket,
        query: { text: string; property: SearchProperty; limit: number }
      ) => {
        switch (query.property) {
          case "run":
            return { matchingVehicles: [], hasMoreMatches: false }
          case "vehicle":
            return {
              matchingVehicles: [],
              hasMoreMatches: false,
            }
          case "operator":
            return {
              matchingVehicles: [operatorMatch],
              hasMoreMatches: false,
            }
        }
      }
    )

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "123" },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty selectSearchResult={jest.fn()} />
      </StateDispatchProvider>
    )
    expect(
      screen.getByRole("heading", { name: "Operators" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Vehicles" })).toBeNull()
    expect(screen.queryByRole("heading", { name: "Runs" })).toBeNull()
  })

  test("only includes results for the properties included in the query", () => {
    ;(useLimitedSearchResults as jest.Mock).mockReturnValue({
      matchingVehicles: [vehicleMatch],
      hasMoreMatches: false,
    })

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "123",
              properties: [{ property: "vehicle", limit: 5 }],
            },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty selectSearchResult={jest.fn()} />
      </StateDispatchProvider>
    )
    expect(
      screen.getByRole("heading", { name: "Vehicles" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Runs" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Operators" })
    ).not.toBeInTheDocument()
  })

  test("Includes the sections in the expected order", () => {
    ;(useLimitedSearchResults as jest.Mock).mockImplementation(
      (
        _socket,
        query: { text: string; property: SearchProperty; limit: number }
      ) => {
        switch (query.property) {
          case "run":
            return { matchingVehicles: [runMatch], hasMoreMatches: false }
          case "vehicle":
            return {
              matchingVehicles: [vehicleMatch],
              hasMoreMatches: false,
            }
          case "operator":
            return {
              matchingVehicles: [operatorMatch],
              hasMoreMatches: false,
            }
        }
      }
    )

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "123" },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty selectSearchResult={jest.fn()} />
      </StateDispatchProvider>
    )
    const [vehicles, operators, runs] = screen.getAllByRole("heading")
    expect(vehicles).toHaveTextContent("Vehicles")
    expect(operators).toHaveTextContent("Operators")
    expect(runs).toHaveTextContent("Runs")
  })

  test("Lists the matching vehicles under the appropriate header", () => {
    ;(useLimitedSearchResults as jest.Mock).mockImplementation(
      (
        _socket,
        query: { text: string; property: SearchProperty; limit: number }
      ) => {
        switch (query.property) {
          case "run":
            return { matchingVehicles: [runMatch], hasMoreMatches: false }
          case "vehicle":
            return {
              matchingVehicles: [vehicleMatch],
              hasMoreMatches: false,
            }
          case "operator":
            return {
              matchingVehicles: [operatorMatch],
              hasMoreMatches: false,
            }
        }
      }
    )

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "123" },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty selectSearchResult={jest.fn()} />
      </StateDispatchProvider>
    )
    const vehicles = screen.getByLabelText("Vehicles")
    expect(
      within(vehicles).getByRole("cell", { name: vehicleMatch.label! })
    ).toBeInTheDocument()

    const operators = screen.getByLabelText("Operators")
    expect(
      within(operators).getByRole("cell", { name: operatorMatch.label! })
    ).toBeInTheDocument()

    const runs = screen.getByLabelText("Runs")
    expect(
      within(runs).getByRole("cell", { name: runMatch.label! })
    ).toBeInTheDocument()
  })

  test("For sections that have more matches, includes a 'Show more' button", () => {
    ;(useLimitedSearchResults as jest.Mock).mockReturnValue({
      matchingVehicles: [vehicleMatch],
      hasMoreMatches: true,
    })

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "123",
              properties: [{ property: "vehicle", limit: 5 }],
            },

            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty selectSearchResult={jest.fn()} />
      </StateDispatchProvider>
    )
    expect(
      screen.getByRole("button", { name: "Show more" })
    ).toBeInTheDocument()
  })
})
