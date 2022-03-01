import { renderHook } from "@testing-library/react-hooks"
import React, { ReactNode } from "react"
import * as Api from "../../src/api"
import useSwings from "../../src/hooks/useSwings"
import { instantPromise } from "../testHelpers/mockHelpers"
import { initialState } from "../../src/state"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { RouteTab } from "../../src/models/routeTab"
import routeTabFactory from "../factories/routeTab"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchSwings: jest.fn(() => new Promise(() => {})),
}))

describe("useSwings", () => {
  test("returns null while loading", () => {
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    const { result } = renderHook(() => {
      return useSwings()
    })
    expect(mockFetchSwings).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const swings = [
      {
        from_route_id: "1",
        from_run_id: "123-456",
        from_trip_id: "1234",
        to_route_id: "1",
        to_run_id: "123-789",
        to_trip_id: "5678",
        time: 100,
      },
      {
        from_route_id: "2",
        from_run_id: "124-456",
        from_trip_id: "4321",
        to_route_id: "2",
        to_run_id: "124-789",
        to_trip_id: "8765",
        time: 100,
      },
    ]
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    mockFetchSwings.mockImplementationOnce(() => instantPromise(swings))
    const { result } = renderHook(
      () => {
        return useSwings()
      },
      {
        wrapper,
        initialProps: {
          routeTabs: [
            routeTabFactory.build({
              ordering: 0,
              isCurrentTab: true,
              selectedRouteIds: ["1"],
            }),
            routeTabFactory.build({
              ordering: 1,
              isCurrentTab: false,
              selectedRouteIds: ["2"],
            }),
            routeTabFactory.build({
              ordering: undefined,
              selectedRouteIds: ["3"],
            }),
          ],
        },
      }
    )

    expect(mockFetchSwings).toHaveBeenCalledWith(["1", "2"])
    expect(result.current).toEqual(swings)
  })

  test("doesn't refetch swings on every render", () => {
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    const { rerender } = renderHook(
      () => {
        useSwings()
      },

      {
        wrapper,
        initialProps: {
          routeTabs: [routeTabFactory.build({ selectedRouteIds: ["1"] })],
        },
      }
    )
    rerender()
    expect(mockFetchSwings).toHaveBeenCalledTimes(1)
  })

  test("does refetch swings when selected routes change", () => {
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    const { rerender } = renderHook(
      () => {
        useSwings()
      },
      {
        wrapper,
        initialProps: {
          routeTabs: [routeTabFactory.build({ selectedRouteIds: ["1"] })],
        },
      }
    )
    rerender({
      routeTabs: [routeTabFactory.build({ selectedRouteIds: ["2"] })],
    })
    expect(mockFetchSwings).toHaveBeenCalledTimes(2)
  })
})

const wrapper = ({
  children,
  routeTabs,
}: {
  children?: ReactNode
  routeTabs: RouteTab[]
}) => (
  <StateDispatchProvider
    state={{ ...initialState, routeTabs }}
    dispatch={jest.fn()}
  >
    <> {children} </>
  </StateDispatchProvider>
)
