import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import SearchResultsByCategory from "../../../src/components/mapPage/searchResultsByCategory"
import vehicleFactory from "../../factories/vehicle"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import stateFactory from "../../factories/applicationState"
import { searchPageStateFactory } from "../../factories/searchPageState"
import locationSearchResultFactory from "../../factories/locationSearchResult"
import { LocationSearchResult } from "../../../src/models/locationSearchResult"
import useSearchResultsByCategory from "../../../src/hooks/useSearchResultsByCategory"
import { searchQueryLocationFactory } from "../../factories/searchQuery"
import { searchQueryVehicleFactory } from "../../factories/searchQuery"
import userEvent from "@testing-library/user-event"
import { setCategoryMatchLimit } from "../../../src/state/searchPageState"
import { defaultResultLimit } from "../../../src/models/searchQuery"

jest.mock("../../../src/hooks/useSearchResultsByCategory", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()
const vehicleMatch = vehicleFactory.build()
const locationMatch = locationSearchResultFactory.build()

beforeEach(() => {
  ;(useSearchResultsByCategory as jest.Mock).mockReturnValue({
    vehicle: {
      ok: {
        matches: [vehicleMatch, runMatch, operatorMatch],
        hasMoreMatches: true,
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
    ;(useSearchResultsByCategory as jest.Mock).mockReturnValue({
      run: { ok: { matches: [], hasMoreMatches: false } },
      vehicle: {
        ok: {
          matches: [vehicleMatch],
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
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    expect(
      screen.getByRole("heading", { name: "Vehicles" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Locations" })).toBeNull()
  })

  test("when search property is a vehicle property, doesn't show location results", () => {
    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "123",
              property: "vehicle",
            },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    expect(
      screen.getByRole("heading", { name: "Vehicles" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Locations" })
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
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    const [vehicles, locations] = screen.getAllByRole("heading")
    expect(vehicles).toHaveTextContent("Vehicles")
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
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    const vehicles = screen.getByLabelText("Vehicles")
    expect(
      within(vehicles).getByRole("cell", { name: vehicleMatch.label! })
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
        <SearchResultsByCategory
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
    ;(useSearchResultsByCategory as jest.Mock).mockReturnValue({
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
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    const locations = screen.getByLabelText("Locations")
    expect(locations).toHaveTextContent(/loading/i)
  })

  test("When there are more vehicle matches, includes a 'Show more' button which updates the vehicle result limit on click", async () => {
    ;(useSearchResultsByCategory as jest.Mock).mockReturnValue({
      vehicle: {
        ok: {
          matches: [vehicleMatch],
          hasMoreMatches: true,
        },
      },
      location: {
        ok: {
          matches: [],
          hasMoreMatches: false,
        },
      },
    })

    const mockDispatch = jest.fn()

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: {
              text: "123",
            },

            isActive: true,
          }),
        })}
        dispatch={mockDispatch}
      >
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    await userEvent.click(
      within(screen.getByLabelText("Vehicles")).getByRole("button", {
        name: "Show more",
      })
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      setCategoryMatchLimit("vehicle", defaultResultLimit + 25)
    )
  })

  test("When locations section has more matches, includes a 'Show more' button which updates the location result limit on click", async () => {
    const locations: LocationSearchResult[] = []

    for (let i = 0; i <= 5; i++) {
      locations.push(locationSearchResultFactory.build())
    }

    ;(useSearchResultsByCategory as jest.Mock).mockReturnValue({
      vehicle: null,
      location: { ok: { matches: locations, hasMoreMatches: true } },
    })
    const mockDispatch = jest.fn()
    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: searchQueryLocationFactory.build({ text: "location" }),
            isActive: true,
          }),
        })}
        dispatch={mockDispatch}
      >
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    await userEvent.click(
      within(screen.getByLabelText("Locations")).getByRole("button", {
        name: "Show more",
      })
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      setCategoryMatchLimit("location", defaultResultLimit + 25)
    )
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
        <SearchResultsByCategory
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
    ;(useSearchResultsByCategory as jest.Mock).mockReturnValue({
      vehicle: {
        ok: {
          matches: [],
          hasMoreMatches: true,
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
            query: searchQueryVehicleFactory.build({ text: "123" }),
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <SearchResultsByCategory
          onSelectVehicleResult={jest.fn()}
          onSelectLocationResult={jest.fn()}
        />
      </StateDispatchProvider>
    )
    expect(screen.getByText("No Search Results")).toBeInTheDocument()
  })
})
