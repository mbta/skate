import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { fetchDetourDirections } from "../../src/api"
import { renderHook, waitFor } from "@testing-library/react"
import { useDetour } from "../../src/hooks/useDetour"
import { act } from "react-dom/test-utils"
import { detourShapeFactory } from "../factories/detourShapeFactory"
import { ShapePoint } from "../../src/schedule"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockResolvedValue(null)
})

describe("useDetour", () => {
  test("when `addConnectionPoint` is first called, `startPoint` is set", () => {
    const start = { lat: 0, lon: 0 }

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))

    expect(result.current.startPoint).toBe(start)
  })

  test("when `addConnectionPoint` is called a second time, `endPoint` is set", () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addConnectionPoint(end))

    expect(result.current.startPoint).toBe(start)
    expect(result.current.endPoint).toBe(end)
  })

  test("when `startPoint` is null, `addWaypoint` does nothing", () => {
    const { result } = renderHook(useDetour)

    expect(result.current.startPoint).toBeNull()

    act(() => result.current.addWaypoint({ lat: 0, lon: 0 }))

    expect(result.current.waypoints).toHaveLength(0)
  })

  test("when `endPoint` is set, `addWaypoint` does nothing", () => {
    const { result } = renderHook(useDetour)

    expect(result.current.startPoint).toBeNull()

    act(() => result.current.addConnectionPoint({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint({ lat: 1, lon: 1 }))

    act(() => result.current.addWaypoint({ lat: 0, lon: 0 }))

    expect(result.current.waypoints).toHaveLength(0)
  })

  test("when `addWaypoint` is called, should update `detourShape` and `directions`", async () => {
    const start: ShapePoint = { lat: -2, lon: -2 }
    const end: ShapePoint = { lat: -1, lon: -1 }

    const detourShape = detourShapeFactory.build({
      coordinates: [
        { lat: 0, lon: 0 },
        { lat: 1, lon: 1 },
        { lat: 2, lon: 2 },
      ],
      directions: [
        { instruction: "Turn Left onto Main St" },
        { instruction: "Turn Right onto High St" },
      ],
    })

    jest.mocked(fetchDetourDirections).mockImplementation((coordinates) => {
      expect(coordinates).toStrictEqual([start, end])
      return Promise.resolve(detourShape)
    })

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addWaypoint(end))

    expect(result.current.startPoint).toBe(start)

    expect(jest.mocked(fetchDetourDirections)).toHaveBeenCalledTimes(1)
    expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(1, [
      start,
      end,
    ])

    await waitFor(() => {
      expect(result.current.detourShape).toStrictEqual(detourShape.coordinates)
      expect(result.current.directions).toStrictEqual(detourShape.directions)
    })
  })

  test("when `undoLastWaypoint` is called, removes the last `waypoint`", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addWaypoint(end))

    expect(result.current.waypoints).toStrictEqual([end])

    act(() => result.current.undoLastWaypoint())

    expect(result.current.waypoints).toHaveLength(0)
  })

  test("when `undoLastWaypoint` is called, should call API with updated waypoints", async () => {
    const start = { lat: 0, lon: 0 }
    const mid = { lat: 0.5, lon: 0.5 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addWaypoint(mid))
    act(() => result.current.addWaypoint(end))
    act(() => result.current.undoLastWaypoint())

    expect(jest.mocked(fetchDetourDirections)).toHaveBeenCalledTimes(3)
    expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(3, [
      start,
      mid,
    ])
  })

  test("when `waypoints` is empty, `canUndo` is `false`", async () => {
    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint({ lat: 0, lon: 0 }))

    expect(result.current.waypoints).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
  })

  test("when `waypoints` is not empty, `canUndo` is `true`", async () => {
    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint({ lat: 0, lon: 0 }))
    act(() => result.current.addWaypoint({ lat: 1, lon: 1 }))

    expect(result.current.waypoints).not.toHaveLength(0)
    expect(result.current.canUndo).toBe(true)
  })

  test("when `endPoint` is set, `canUndo` is `false`", async () => {
    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint({ lat: 0, lon: 0 }))
    act(() => result.current.addConnectionPoint({ lat: 0, lon: 0 }))

    expect(result.current.endPoint).not.toBeNull()
    expect(result.current.canUndo).toBe(false)
  })
})
