import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import SearchResultsByProperty from "../../../src/components/mapPage/searchResultsByProperty"
import { useLocationSearchResults } from "../../../src/hooks/useLocationSearchResults"
import vehicleFactory from "../../factories/vehicle"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import stateFactory from "../../factories/applicationState"
import { searchPageStateFactory } from "../../factories/searchPageState"
import locationSearchResultFactory from "../../factories/locationSearchResult"
import { LocationSearchResult } from "../../../src/models/locationSearchResult"
import useSearchResultsByProperty from "../../../src/hooks/useSearchResultsByProperty"
import { searchQueryLocationFactory } from "../../factories/searchQuery"
import { searchQueryVehicleFactory } from "../../factories/searchQuery"

jest.mock("../../../src/hooks/useSearchResultsByProperty", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useLocationSearchResults", () => ({
  __esModule: true,
  useLocationSearchResults: jest.fn(() => null),
}))

const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()
const vehicleMatch = vehicleFactory.build()

beforeEach(() => {
  ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
    run: {
      ok: {
        matchingVehicles: [runMatch],
        hasMoreMatches: false,
      },
    },
    vehicle: {
      ok: {
        matchingVehicles: [vehicleMatch],
        hasMoreMatches: true,
      },
    },
    operator: {
      ok: {
        matchingVehicles: [operatorMatch],
        hasMoreMatches: false,
      },
    },
    location: {
      ok: {
        matchingVehicles: [],
        hasMoreMatches: false,
      },
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("searchResultsByProperty", () => {
  test("Includes only sections that have results", () => {
    ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
      run: { ok: { matchingVehicles: [], hasMoreMatches: false } },
      vehicle: {
        ok: {
          matchingVehicles: [],
          hasMoreMatches: false,
        },
      },
      operator: {
        ok: {
          matchingVehicles: [operatorMatch],
          hasMoreMatches: false,
        },
      },
      location: {
        ok: {
          matchingVehicles: [],
          hasMoreMatches: false,
        },
      },
    })
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
            query: searchQueryLocationFactory.build({ text: "location" }),
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
            query: searchQueryLocationFactory.build({ text: "location" }),
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
    ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
      run: {
        ok: {
          matchingVehicles: [runMatch],
          hasMoreMatches: false,
        },
      },
      vehicle: {
        ok: {
          matchingVehicles: [vehicleMatch],
          hasMoreMatches: true,
        },
      },
      operator: {
        ok: {
          matchingVehicles: [operatorMatch],
          hasMoreMatches: false,
        },
      },
      location: {
        ok: {
          matchingVehicles: [],
          hasMoreMatches: false,
        },
      },
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
            query: searchQueryLocationFactory.build({ text: "location" }),
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
            query: searchQueryLocationFactory.build({ text: "location" }),
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

  test("when there are no results for the given properties, display no results message", () => {
    ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
      run: {
        ok: {
          matchingVehicles: [],
          hasMoreMatches: false,
        },
      },
      vehicle: {
        ok: {
          matchingVehicles: [],
          hasMoreMatches: true,
        },
      },
      operator: null,
      location: {
        ok: {
          matchingVehicles: [],
          hasMoreMatches: false,
        },
      },
    })

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: searchQueryVehicleFactory.build({ text: "123" }),
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
    expect(screen.getByText("No Search Results")).toBeInTheDocument()
  })
})
