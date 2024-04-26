import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals"
import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
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
import {
  busesCategory,
  category,
  locationsCategory,
} from "../../testHelpers/selectors/components/mapPage/searchResultsByCategory"

jest.mock("../../../src/hooks/useSearchResultsByCategory", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()
const vehicleMatch = vehicleFactory.build()
const locationMatch = locationSearchResultFactory.build()

beforeEach(() => {
  jest.mocked(useSearchResultsByCategory).mockReturnValue({
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
    jest.mocked(useSearchResultsByCategory).mockReturnValue({
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
    expect(busesCategory.get()).toBeInTheDocument()
    expect(locationsCategory.query()).not.toBeInTheDocument()
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
    expect(busesCategory.get()).toBeInTheDocument()
    expect(locationsCategory.query()).not.toBeInTheDocument()
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
    const [vehicles, locations] = category.getAll()
    expect(vehicles).toBe(busesCategory.get())
    expect(locations).toBe(locationsCategory.get())
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
    const vehicles = busesCategory.get()
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
    expect(
      within(locationsCategory.get()).getByLabelText(locationMatch.name!)
    ).toBeInTheDocument()
  })

  test("Shows loading indication for locations", () => {
    jest.mocked(useSearchResultsByCategory).mockReturnValue({
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
    expect(locationsCategory.get()).toHaveTextContent(/loading/i)
  })

  test("When there are more vehicle matches, includes a 'Show more' button which updates the vehicle result limit on click", async () => {
    jest.mocked(useSearchResultsByCategory).mockReturnValue({
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
      within(busesCategory.get()).getByRole("button", {
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

    jest.mocked(useSearchResultsByCategory).mockReturnValue({
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
      within(locationsCategory.get()).getByRole("button", {
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
      within(locationsCategory.get()).queryByRole("button", {
        name: "Show more",
      })
    ).not.toBeInTheDocument()
  })

  test("when there are no results for the given properties, display no results message", () => {
    jest.mocked(useSearchResultsByCategory).mockReturnValue({
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
