import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import SearchResultsByProperty from "../../../src/components/mapPage/searchResultsByProperty"
import { useLimitedSearchResults } from "../../../src/hooks/useSearchResults"
import { useLocationSearchResults } from "../../../src/hooks/useLocationSearchResults"
import vehicleFactory from "../../factories/vehicle"
import { SearchProperty } from "../../../src/models/searchQuery"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import stateFactory from "../../factories/applicationState"
import { searchPageStateFactory } from "../../factories/searchPageState"
import locationSearchResultFactory from "../../factories/locationSearchResult"
import { LocationSearchResult } from "../../../src/models/locationSearchResult"

jest.mock("../../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  useLimitedSearchResults: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useLocationSearchResults", () => ({
  __esModule: true,
  useLocationSearchResults: jest.fn(() => null),
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
          case "location":
            return {
              matchingVehicles: [],
              hasMoreMatches: false,
            }
        }
      }
    )
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [])

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
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
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
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [])

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "123",
              properties: { vehicle: 5, run: null, operator: null },
            },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
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
          case "location":
            return {
              matchingVehicles: [],
              hasMoreMatches: false,
            }
        }
      }
    )
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [])

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
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    const [vehicles, operators, runs, locations] =
      screen.getAllByRole("heading")
    expect(vehicles).toHaveTextContent("Vehicles")
    expect(operators).toHaveTextContent("Operators")
    expect(runs).toHaveTextContent("Runs")
    expect(locations).toHaveTextContent("Locations")
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
          case "location":
            return {
              matchingVehicles: [],
              hasMoreMatches: false,
            }
        }
      }
    )
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [])

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
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
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

  test("Lists the matching locations under the locations header", () => {
    const locationMatch = locationSearchResultFactory.build()
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [
      locationMatch,
    ])

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "location" },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    const locations = screen.getByLabelText("Locations")
    expect(
      within(locations).getByLabelText(locationMatch.name!)
    ).toBeInTheDocument()
  })

  test("Shows loading indication for locations", () => {
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => null)

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "location" },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    const locations = screen.getByLabelText("Locations")
    expect(locations).toHaveTextContent(/loading/i)
  })

  test("For sections that have more matches, includes a 'Show more' button", () => {
    ;(useLimitedSearchResults as jest.Mock).mockReturnValue({
      matchingVehicles: [vehicleMatch],
      hasMoreMatches: true,
    })
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [])

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "123",
              properties: { vehicle: 5 },
            },

            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    expect(
      within(screen.getByLabelText("Vehicles")).getByRole("button", {
        name: "Show more",
      })
    ).toBeInTheDocument()
  })

  test("When locations section has more matches, includes a 'Show more' button", () => {
    const locations: LocationSearchResult[] = []

    for (let i = 0; i <= 5; i++) {
      locations.push(locationSearchResultFactory.build())
    }

    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => locations)

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "location",
              properties: { location: 5 },
            },

            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    expect(
      within(screen.getByLabelText("Locations")).getByRole("button", {
        name: "Show more",
      })
    ).toBeInTheDocument()
  })

  test("When locations section does not have more matches, doesn't include a 'Show more' button", () => {
    ;(useLocationSearchResults as jest.Mock).mockImplementation(() => [
      locationSearchResultFactory.build(),
    ])

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "location",
              properties: { location: 5 },
            },

            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByProperty
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    expect(
      within(screen.getByLabelText("Locations")).queryByRole("button", {
        name: "Show more",
      })
    ).not.toBeInTheDocument()
  })
})
