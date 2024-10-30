import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import React, { ReactNode } from "react"
import * as Api from "../../src/api"
import useSwings from "../../src/hooks/useSwings"
import { instantPromise } from "../testHelpers/mockHelpers"
import { initialState } from "../../src/state"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { RouteTab } from "../../src/models/routeTab"
import routeTabFactory from "../factories/routeTab"
import { neverPromise } from "../testHelpers/mockHelpers"
import { swingFactory } from "../factories/swing"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(Api.fetchSwings).mockReturnValue(neverPromise())
})

describe("useSwings", () => {
  test("returns null while loading", () => {
    const { result } = renderHook(useSwings)
    expect(jest.mocked(Api.fetchSwings)).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const swings = swingFactory.buildList(2)
    jest
      .mocked(Api.fetchSwings)
      .mockImplementationOnce(() => instantPromise(swings))

    const { result } = renderHook(useSwings, {
      wrapper: ({ children }) => (
        <Wrapper
          routeTabs={[
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
          ]}
        >
          {children}
        </Wrapper>
      ),
    })

    expect(jest.mocked(Api.fetchSwings)).toHaveBeenCalledWith(["1", "2"])
    expect(result.current).toEqual(swings)
  })

  test("doesn't refetch swings on every render", () => {
    const { rerender } = renderHook(useSwings, {
      wrapper: ({ children }) => (
        <Wrapper
          routeTabs={[routeTabFactory.build({ selectedRouteIds: ["1"] })]}
        >
          {children}
        </Wrapper>
      ),
    })
    rerender()
    expect(jest.mocked(Api.fetchSwings)).toHaveBeenCalledTimes(1)
  })

  test("doesn't refetch swings when route Ids don't change", () => {
    let routeTabs = [
      routeTabFactory.build({
        selectedRouteIds: ["1"],
        isCurrentTab: true,
      }),
      routeTabFactory.build({
        selectedRouteIds: ["2"],
        isCurrentTab: false,
      }),
    ]
    const { rerender } = renderHook(useSwings, {
      wrapper: ({ children }) => (
        <Wrapper routeTabs={routeTabs}>{children}</Wrapper>
      ),
    })
    routeTabs = [
      routeTabFactory.build({ selectedRouteIds: ["1"], isCurrentTab: false }),
      routeTabFactory.build({ selectedRouteIds: ["2"], isCurrentTab: true }),
    ]
    rerender()
    expect(jest.mocked(Api.fetchSwings)).toHaveBeenCalledTimes(1)
  })

  test("does refetch swings when selected routes change", () => {
    let routeTabs = [routeTabFactory.build({ selectedRouteIds: ["1"] })]
    const { rerender } = renderHook(useSwings, {
      wrapper: ({ children }) => (
        <Wrapper routeTabs={routeTabs}>{children}</Wrapper>
      ),
    })
    routeTabs = [routeTabFactory.build({ selectedRouteIds: ["2"] })]
    rerender()
    expect(jest.mocked(Api.fetchSwings)).toHaveBeenCalledTimes(2)
  })
})

const Wrapper = ({
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
