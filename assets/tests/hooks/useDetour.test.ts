import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import {
  fetchDetourDirections,
  fetchFinishedDetour,
  fetchNearestIntersection,
} from "../../src/api"
import { renderHook, waitFor } from "@testing-library/react"
import { useDetour } from "../../src/hooks/useDetour"
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
  test("when `addWaypoint` is called, should update `detourShape`", async () => {
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

  test("clears `detourShape` there is an error with the routing service", async () => {
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
      expect(result.current.routingError).toBeTruthy()
    })
  })

  test("clears `detourShape` when `undo` removes the last waypoint", async () => {
    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(Ok(detourShapeFactory.build()))

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => result.current.addConnectionPoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))
    act(() => result.current.addWaypoint?.(shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.detourShape).not.toHaveLength(0)
    })

    act(() => result.current.undo?.())
    act(() => result.current.undo?.())

    await waitFor(() => {
      expect(result.current.detourShape).toHaveLength(0)
    })
  })

  test("clears `detourShape` when when `clear` is called", async () => {
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
      expect(result.current.detourShape).toHaveLength(0)
    })
  })

  test("when `endPoint` is set, `routeSegments` is filled in", async () => {
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

  test("when `endPoint` is undone, `routeSegments` is cleared", async () => {
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
