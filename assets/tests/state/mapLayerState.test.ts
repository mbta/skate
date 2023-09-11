import { describe, test, expect } from "@jest/globals"
import {
  initialMapLayersState,
  MapKey,
  reducer,
  togglePullbackLayer,
} from "../../src/state/mapLayersState"

describe("initialMapLayersState", () => {
  test.each<MapKey>(["searchMap", "shuttleMap", "legacySearchMap"])(
    "sets default tile type for %s",
    (mapKey) => {
      expect(initialMapLayersState[mapKey].tileType).toBe("base")
    }
  )

  test("searchMap starts with pull-back layer disabled", () => {
    expect(initialMapLayersState.searchMap.pullbackLayerEnabled).toBeFalsy()
  })
})

describe("reducer", () => {
  test("togglePullbackLayer toggles from false to true", () => {
    const result = reducer(
      initialMapLayersState,
      togglePullbackLayer("searchMap")
    )

    expect(result.searchMap.pullbackLayerEnabled).toBeTruthy()
  })

  test("togglePullbackLayer toggles from true to false", () => {
    const result = reducer(
      {
        ...initialMapLayersState,
        searchMap: {
          ...initialMapLayersState.searchMap,
          pullbackLayerEnabled: true,
        },
      },
      togglePullbackLayer("searchMap")
    )

    expect(result.searchMap.pullbackLayerEnabled).toBeFalsy()
  })

  test("togglePullbackLayer for maps other than search map does nothing", () => {
    const result = reducer(
      initialMapLayersState,
      togglePullbackLayer("shuttleMap")
    )

    expect(result).toEqual(initialMapLayersState)
  })
})
