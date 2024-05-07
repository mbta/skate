import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import {
  fetchDetourDirections,
  fetchFinishedDetour,
  fetchNearestIntersection,
} from "../../src/api"
import { renderHook, waitFor } from "@testing-library/react"
import { DetourState, useDetour } from "../../src/hooks/useDetour"
import { act } from "react-dom/test-utils"
import { detourShapeFactory } from "../factories/detourShapeFactory"
import { ShapePoint } from "../../src/schedule"
import { shapePointFactory } from "../factories/shapePointFactory"
import stopFactory from "../factories/stop"
import { finishedDetourFactory } from "../factories/finishedDetourFactory"
import { routeSegmentsFactory } from "../factories/finishedDetourFactory"
import { originalRouteFactory } from "../factories/originalRouteFactory"
import shapeFactory from "../factories/shape"
import { Err, Ok } from "../../src/util/result"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockReturnValue(new Promise(() => {}))

  jest
    .mocked(fetchFinishedDetour)
    .mockResolvedValue(finishedDetourFactory.build())

  jest.mocked(fetchNearestIntersection).mockReturnValue(new Promise(() => {}))
})

const useDetourWithFakeRoutePattern = () =>
  useDetour(originalRouteFactory.build())

describe("useDetour", () => {
  test.skip("when `addWaypoint` is called, should update `detourShape`", async () => {
    const start: ShapePoint = { lat: -2, lon: -2 }
    const end: ShapePoint = { lat: -1, lon: -1 }

    const detourShape = detourShapeFactory.build({
      coordinates: [
        { lat: 0, lon: 0 },
        { lat: 1, lon: 1 },
        { lat: 2, lon: 2 },
      ],
    })

    jest.mocked(fetchDetourDirections).mockImplementation((coordinates) => {
      expect(coordinates).toStrictEqual([start, end])
      return Promise.resolve(Ok(detourShape))
    })

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addWaypoint?.(end))

    expect(result.current.startPoint).toBe(start)

    expect(jest.mocked(fetchDetourDirections)).toHaveBeenCalledTimes(1)
    expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(1, [
      start,
      end,
    ])

    await waitFor(() => {
      expect(result.current.detourShape).toStrictEqual(detourShape.coordinates)
    })
  })

  test.skip("indicates when there is an error with the routing service", async () => {
    const start: ShapePoint = { lat: -2, lon: -2 }
    const end: ShapePoint = { lat: -1, lon: -1 }

    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(Err({ type: "unknown" }))

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addWaypoint?.(end))

    await waitFor(() => {
      expect(result.current.detourShape).toStrictEqual([])
      expect(result.current.directions).toStrictEqual(undefined)
      expect(result.current.routingError).toBeTruthy()
    })
  })

  test.skip("when `undo` is called, removes `start` and `end` points", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addConnectionPoint?.(end))

    expect(result.current.endPoint).not.toBeNull()

    act(() => result.current.undo?.())

    expect(result.current.endPoint).toBeNull()
    expect(result.current.startPoint).not.toBeNull()

    act(() => result.current.undo?.())

    await waitFor(() => expect(result.current.startPoint).toBeNull())
  })

  test.skip("when `undo` is called, removes the last `waypoint`", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addWaypoint?.(end))

    expect(result.current.waypoints).toStrictEqual([end])

    act(() => result.current.undo?.())

    await waitFor(() => expect(result.current.waypoints).toHaveLength(0))
  })

  test.skip("when `undo` is called, should call API with updated waypoints", async () => {
    const start = { lat: 0, lon: 0 }
    const mid = { lat: 0.5, lon: 0.5 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addWaypoint?.(mid))
    act(() => result.current.addWaypoint?.(end))
    act(() => result.current.undo?.())

    await waitFor(() => {
      expect(jest.mocked(fetchDetourDirections)).toHaveBeenCalledTimes(3)
      expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(3, [
        start,
        mid,
      ])
    })
  })

  test.skip("when `undo` removes the last waypoint, `detourShape` and `directions` should be empty", async () => {
    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(Ok(detourShapeFactory.build()))

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.directions).not.toBeUndefined()
      expect(result.current.detourShape).not.toHaveLength(0)
    })

    act(() => result.current.undo?.())
    act(() => result.current.undo?.())

    await waitFor(() => {
      expect(result.current.waypoints).toHaveLength(0)
      expect(result.current.directions).toBeUndefined()
      expect(result.current.detourShape).toHaveLength(0)
    })
  })

  test.skip("when `clear` is called, removes the start and end points", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addConnectionPoint?.(end))

    expect(result.current.endPoint).not.toBeNull()
    expect(result.current.startPoint).not.toBeNull()

    act(() => result.current.clear?.())

    await waitFor(() => {
      expect(result.current.endPoint).toBeNull()
      expect(result.current.startPoint).toBeNull()
    })
  })

  test.skip("when `clear` is called, removes all waypoints", async () => {
    const start = { lat: 0, lon: 0 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(start))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))

    expect(result.current.waypoints).toHaveLength(2)

    act(() => result.current.clear?.())

    await waitFor(() => expect(result.current.waypoints).toHaveLength(0))
  })

  test.skip("when `clear` is called, `detourShape` and `directions` should be empty", async () => {
    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(Ok(detourShapeFactory.build()))

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.directions).not.toBeUndefined()
      expect(result.current.detourShape).not.toHaveLength(0)
    })

    act(() => result.current.clear?.())

    await waitFor(() => {
      expect(result.current.waypoints).toHaveLength(0)
      expect(result.current.directions).toBeUndefined()
      expect(result.current.detourShape).toHaveLength(0)
    })
  })

  test.skip("when `startPoint` is null, `canUndo` is `false`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    await waitFor(() => {
      expect(result.current.startPoint).toBeNull()
      expect(result.current.canUndo).toBe(false)
    })
  })

  test.skip("when `startPoint` is set, `canUndo` is `true`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.startPoint).not.toBeNull()
      expect(result.current.canUndo).toBe(true)
    })
  })

  test.skip("when `endPoint` is set, `canUndo` is `true`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toBeUndefined()
    })

    expect(result.current.endPoint).not.toBeNull()
    expect(result.current.canUndo).toBe(true)
  })

  test.skip("when `endPoint` is set, `missedStops` is filled in", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const missedStops = stopFactory.buildList(3)

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ missedStops }))

    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toHaveLength(0)
    })

    expect(result.current.missedStops).toStrictEqual(missedStops)
  })

  test.skip("when `endPoint` is set, `routeSegments` is filled in", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const routeSegments = routeSegmentsFactory.build()

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ routeSegments }))

    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toHaveLength(0)
    })

    expect(result.current.routeSegments).toEqual(routeSegments)
  })

  test.skip("when `endPoint` is set, `connectionPoints` is filled in", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const connectionPoint = {
      start: stopFactory.build(),
      end: stopFactory.build(),
    }

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ connectionPoint }))

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.connectionPoints).toEqual(connectionPoint)
    })
  })

  test.skip("when `endPoint` is undone, `missedStops` is cleared", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const missedStops = stopFactory.buildList(3)

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ missedStops }))

    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toHaveLength(0)
    })

    act(() => result.current.undo?.())

    await waitFor(() => {
      expect(result.current.missedStops).toBeUndefined()
    })
  })

  test.skip("when `endPoint` is undone, `routeSegments` is cleared", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint?.({ lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.routeSegments).not.toBeUndefined()
    })

    act(() => result.current.undo?.())

    await waitFor(() => {
      expect(result.current.routeSegments).toBeUndefined()
    })
  })

  test.skip("when `endPoint` is undone, `connectionPoints` is cleared", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.connectionPoints).not.toBeUndefined()
    })

    act(() => result.current.undo?.())

    await waitFor(() => {
      expect(result.current.connectionPoints).toBeUndefined()
    })
  })

  test.skip("initially, `finishDetour` is `undefined`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    await waitFor(() => expect(result.current.finishDetour).toBeUndefined())
  })

  test.skip("initially, `editDetour` is `undefined`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    await waitFor(() => expect(result.current.editDetour).toBeUndefined())
  })

  test.skip("initially, `state` is `Edit`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    await waitFor(() => expect(result.current.state).toBe(DetourState.Edit))
  })

  test.skip("when `endPoint` is set, `finishDetour` is defined", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

    await waitFor(() => expect(result.current.finishDetour).toBeDefined())
  })

  test.skip("calling `finishDetour`, sets `state` to `Finished`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

    act(() => {
      result.current.finishDetour?.()
    })

    await waitFor(() => expect(result.current.state).toBe(DetourState.Finished))
  })

  test.skip("when `state` is `Finished`, `editDetour` is defined", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

    await waitFor(() => expect(result.current.editDetour).toBeUndefined())

    act(() => {
      result.current.finishDetour?.()
      result.current.editDetour?.()
    })

    await waitFor(() => expect(result.current.editDetour).toBeDefined())
  })

  test.skip("calling `editDetour`, sets `state` to `Edit`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

    act(() => {
      result.current.finishDetour?.()
    })
    act(() => {
      result.current.editDetour?.()
    })

    await waitFor(() => expect(result.current.state).toBe(DetourState.Edit))
  })

  describe("when `state` is `Finished`, controls are locked out", () => {
    test.skip("`addWaypoint` is undefined", async () => {
      const { result } = renderFinishedDetour()

      await waitFor(() => expect(result.current.addWaypoint).toBeUndefined())
    })

    test.skip("`addConnectionPoint` is undefined", async () => {
      const { result } = renderFinishedDetour()

      await waitFor(() =>
        expect(result.current.addConnectionPoint).toBeUndefined()
      )
    })

    test.skip("`undo` is undefined", async () => {
      const { result } = renderFinishedDetour()

      await waitFor(() => expect(result.current.undo).toBeUndefined())
    })

    test.skip("`clear` is undefined", async () => {
      const { result } = renderFinishedDetour()

      await waitFor(() => expect(result.current.clear).toBeUndefined())
    })
  })

  describe("stops", () => {
    test.skip("`stops` is initially populated with the stops from the original route shape with a `missed` field added", async () => {
      const stop1 = stopFactory.build()
      const stop2 = stopFactory.build()

      const { result } = renderHook(() =>
        useDetour(
          originalRouteFactory.build({
            shape: shapeFactory.build({ stops: [stop1, stop2] }),
          })
        )
      )

      const expectedStops = [
        { ...stop1, missed: false },
        { ...stop2, missed: false },
      ]

      await waitFor(() =>
        expect(result.current.stops).toStrictEqual(expectedStops)
      )
    })

    test.skip("when the detour is finished, missed stops are marked as missed in `stops`", async () => {
      const stop1 = stopFactory.build()
      const stop2 = stopFactory.build()
      const stop3 = stopFactory.build()
      const stop4 = stopFactory.build()

      jest
        .mocked(fetchFinishedDetour)
        .mockResolvedValue(
          finishedDetourFactory.build({ missedStops: [stop2, stop3] })
        )

      const { result } = renderHook(() =>
        useDetour(
          originalRouteFactory.build({
            shape: shapeFactory.build({ stops: [stop1, stop2, stop3, stop4] }),
          })
        )
      )
      act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
      act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))

      const expectedStops = [
        { ...stop1, missed: false },
        { ...stop2, missed: true },
        { ...stop3, missed: true },
        { ...stop4, missed: false },
      ]

      await waitFor(() => {
        expect(result.current.stops).toStrictEqual(expectedStops)
      })
    })
  })
})

const renderFinishedDetour = () => {
  const renderResult = renderHook(useDetourWithFakeRoutePattern)

  act(() =>
    renderResult.result.current.addConnectionPoint?.(shapePointFactory.build())
  )
  act(() =>
    renderResult.result.current.addConnectionPoint?.(shapePointFactory.build())
  )

  act(() => {
    renderResult.result.current.finishDetour?.()
  })

  return renderResult
}
