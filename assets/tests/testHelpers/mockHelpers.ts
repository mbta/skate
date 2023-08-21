import { jest } from "@jest/globals"
import React, { useReducer, useState } from "react"
import usePatternsByIdForRoute from "../../src/hooks/usePatternsByIdForRoute"
import { VehicleInScheduledService, Ghost } from "../../src/realtime"
import { routePatternFactory } from "../factories/routePattern"
import stopFactory from "../factories/stop"

import shape from "../factories/shape"
import { TileType, tilesetUrlForType } from "../../src/tilesetUrls"

/**
 * A promise that resolves synchronously.
 */
export const instantPromise = <T>(value: T): Promise<T> =>
  ({ then: (onfulfilled: (v: T) => any) => onfulfilled(value) } as Promise<T>)

/**
 * A promise that never resolves.
 */
export const neverPromise = (): Promise<any> => new Promise(() => {})

/**
 * Injects a custom state into the next call to useState by replacing its initial value.
 */
export const mockUseStateOnce = <T>(mockInitialState: T): void => {
  const actualUseState = useState
  const spyUseState = jest.spyOn(React, "useState") as jest.Mock
  spyUseState.mockImplementationOnce(() => actualUseState(mockInitialState))
}

/*
 * Like mockUseStateOnce, but for useReducer
 */
export const mockUseReducerOnce = <StateT, ActionT>(
  reducer: (state: StateT, action: ActionT) => StateT,
  mockInitialState: StateT
) => {
  const actualUseReducer = useReducer
  const spyUseReducer = jest.spyOn(React, "useReducer") as jest.Mock
  spyUseReducer.mockImplementationOnce(() =>
    actualUseReducer(reducer, mockInitialState)
  )
}

export const mockUsePatternsByIdForVehicles = (
  vehicles: (VehicleInScheduledService | Ghost)[],
  params?: { stopCount: number }
) => {
  const routePatternIdentifiers = Array.from(
    new Set(
      vehicles
        .filter((v) => v.routePatternId != null && v.routeId != null)
        .map((v) => [v.routePatternId, v.routeId])
    )
  )

  ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue(
    routePatternIdentifiers
      .map(([routePatternId, routeId]) =>
        routePatternFactory.build({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: routePatternId!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          routeId: routeId!,
          shape: shape.build({
            stops: stopFactory.buildList(params?.stopCount || 2),
          }),
        })
      )
      .reduce((map, rp) => {
        return { ...map, [rp.id]: rp }
      }, {})
  )
}

export const mockFullStoryEvent = (): void => {
  Object.defineProperty(window, "FS", {
    writable: true,
    value: { event: jest.fn(), identify: jest.fn() },
  })
}

export const mockTileUrls = (): void => {
  ;(
    tilesetUrlForType as jest.Mock<typeof tilesetUrlForType>
  ).mockImplementation((type: TileType) => {
    switch (type) {
      case "base":
        return "test_base_url/{z}/{x}/{y}"
      case "satellite":
        return "test_satellite_url/{z}/{x}/{y}"
    }
  })
}
