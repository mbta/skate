import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import SearchResultsByProperty from "../../../src/components/mapPage/searchResultsByProperty"
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

const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()
const vehicleMatch = vehicleFactory.build()
const locationMatch = locationSearchResultFactory.build()

beforeEach(() => {
  ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
    run: {
      ok: {
        matches: [runMatch],
        hasMoreMatches: false,
      },
    },
    vehicle: {
      ok: {
        matches: [vehicleMatch],
        hasMoreMatches: true,
      },
    },
    operator: {
      ok: {
        matches: [operatorMatch],
        hasMoreMatches: false,
      },
    },
    location: {
      ok: {
        matches: [locationMatch],
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
      run: { ok: { matches: [], hasMoreMatches: false } },
      vehicle: {
        ok: {
          matches: [],
          hasMoreMatches: false,
        },
      },
      operator: {
        ok: {
          matches: [operatorMatch],
          hasMoreMatches: false,
        },
      },
      location: {
        ok: { matches: [], hasMoreMatches: false },
      },
    })

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
    expect(
      screen.queryByRole("heading", { name: "location" })
    ).not.toBeInTheDocument()
  })

  test("Includes the sections in the expected order", () => {
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
    ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
      run: null,
      vehicle: null,
      operator: null,
      location: { is_loading: true },
    })
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
          matches: [runMatch],
          hasMoreMatches: false,
        },
      },
      vehicle: {
        ok: {
          matches: [vehicleMatch],
          hasMoreMatches: true,
        },
      },
      operator: {
        ok: {
          matches: [operatorMatch],
          hasMoreMatches: false,
        },
      },
      location: {
        ok: {
          matches: [],
          hasMoreMatches: false,
        },
      },
    })

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

    ;(useSearchResultsByProperty as jest.Mock).mockReturnValue({
      run: null,
      vehicle: null,
      operator: null,
      location: { ok: { matches: locations, hasMoreMatches: true } },
    })
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
          matches: [],
          hasMoreMatches: false,
        },
      },
      vehicle: {
        ok: {
          matches: [],
          hasMoreMatches: true,
        },
      },
      operator: null,
      location: {
        ok: { matches: [], hasMoreMatches: false },
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
