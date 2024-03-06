import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { fetchDetourDirections, fetchFinishedDetour } from "../../src/api"
import { renderHook, waitFor } from "@testing-library/react"
import { Detour, DetourState, useDetour } from "../../src/hooks/useDetour"
import { act } from "react-dom/test-utils"
import { detourShapeFactory } from "../factories/detourShapeFactory"
import { ShapePoint } from "../../src/schedule"
import { shapePointFactory } from "../factories/shapePointFactory"
import stopFactory from "../factories/stop"
import { finishedDetourFactory } from "../factories/finishedDetourFactory"
import { routeSegmentsFactory } from "../factories/finishedDetourFactory"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockResolvedValue(null)

  jest
    .mocked(fetchFinishedDetour)
    .mockResolvedValue(finishedDetourFactory.build())
})

const useDetourWithFakeRoutePattern = () => useDetour("routePatternId")

const addConnectionPoint = (detourInfo: Detour, point: ShapePoint) => {
  expect(detourInfo.state).toBe(DetourState.Edit)

  if (detourInfo.state === DetourState.Edit) {
    detourInfo.addConnectionPoint?.(point)
  }
}
const addWaypoint = (detourInfo: Detour, point: ShapePoint) => {
  expect(detourInfo.state).toBe(DetourState.Edit)

  if (detourInfo.state === DetourState.Edit) {
    detourInfo.addWaypoint?.(point)
  }
}
const undo = (detourInfo: Detour) => {
  expect(detourInfo.state).toBe(DetourState.Edit)

  if (detourInfo.state === DetourState.Edit) {
    detourInfo.undo?.()
  }
}
const clear = (detourInfo: Detour) => {
  expect(detourInfo.state).toBe(DetourState.Edit)

  if (detourInfo.state === DetourState.Edit) {
    detourInfo.clear?.()
  }
}
const editDetour = (detourInfo: Detour) => {
  expect(detourInfo.state).toBe(DetourState.Finished)

  if (detourInfo.state === DetourState.Finished) {
    detourInfo.editDetour()
  }
}
const finishDetour = (detourInfo: Detour) => {
  expect(detourInfo.state).toBe(DetourState.Edit)

  if (detourInfo.state === DetourState.Edit) {
    detourInfo.finishDetour?.()
  }
}

describe("useDetour", () => {
  test("when `addConnectionPoint` is first called, `startPoint` is set", () => {
    const start = { lat: 0, lon: 0 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))

    expect(result.current.startPoint).toBe(start)
  })

  test("when `addConnectionPoint` is called a second time, `endPoint` is set", () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addConnectionPoint(result.current, end))

    waitFor(() => {
      expect(result.current.startPoint).toBe(start)
      expect(result.current.endPoint).toBe(end)
    })
  })

  test("when `startPoint` is null, `addWaypoint` does nothing", () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    expect(result.current.startPoint).toBeNull()

    act(() => addWaypoint(result.current, { lat: 0, lon: 0 }))

    expect(result.current.waypoints).toHaveLength(0)
  })

  test("when `endPoint` is set, `addWaypoint` does nothing", () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    jest.mocked(fetchFinishedDetour).mockResolvedValue(null)

    expect(result.current.startPoint).toBeNull()

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))
    act(() => addConnectionPoint(result.current, { lat: 1, lon: 1 }))

    act(() => addWaypoint(result.current, { lat: 0, lon: 0 }))

    waitFor(() => expect(result.current.waypoints).toHaveLength(0))
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

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addWaypoint(result.current, end))

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

  test("when `undo` is called, removes `start` and `end` points", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addConnectionPoint(result.current, end))

    expect(result.current.endPoint).not.toBeNull()

    act(() => undo(result.current))

    expect(result.current.endPoint).toBeNull()
    expect(result.current.startPoint).not.toBeNull()

    act(() => undo(result.current))

    expect(result.current.startPoint).toBeNull()
  })

  test("when `undo` is called, removes the last `waypoint`", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addWaypoint(result.current, end))

    expect(result.current.waypoints).toStrictEqual([end])

    act(() => undo(result.current))

    expect(result.current.waypoints).toHaveLength(0)
  })

  test("when `undo` is called, should call API with updated waypoints", async () => {
    const start = { lat: 0, lon: 0 }
    const mid = { lat: 0.5, lon: 0.5 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addWaypoint(result.current, mid))
    act(() => addWaypoint(result.current, end))
    act(() => undo(result.current))

    expect(jest.mocked(fetchDetourDirections)).toHaveBeenCalledTimes(3)
    expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(3, [
      start,
      mid,
    ])
  })

  test("when `undo` removes the last waypoint, `detourShape` and `directions` should be empty", async () => {
    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(detourShapeFactory.build())

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, shapePointFactory.build()))
    act(() => addWaypoint(result.current, shapePointFactory.build()))
    act(() => addWaypoint(result.current, shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.directions).not.toBeUndefined()
      expect(result.current.detourShape).not.toHaveLength(0)
    })

    act(() => undo(result.current))
    act(() => undo(result.current))

    expect(result.current.waypoints).toHaveLength(0)
    expect(result.current.directions).toBeUndefined()
    expect(result.current.detourShape).toHaveLength(0)
  })

  test("when `clear` is called, removes the start and end points", async () => {
    const start = { lat: 0, lon: 0 }
    const end = { lat: 1, lon: 1 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addConnectionPoint(result.current, end))

    expect(result.current.endPoint).not.toBeNull()
    expect(result.current.startPoint).not.toBeNull()

    act(() => clear(result.current))

    expect(result.current.endPoint).toBeNull()
    expect(result.current.startPoint).toBeNull()
  })

  test("when `clear` is called, removes all waypoints", async () => {
    const start = { lat: 0, lon: 0 }

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, start))
    act(() => addWaypoint(result.current, shapePointFactory.build()))
    act(() => addWaypoint(result.current, shapePointFactory.build()))

    expect(result.current.waypoints).toHaveLength(2)

    act(() => clear(result.current))

    expect(result.current.waypoints).toHaveLength(0)
  })

  test("when `clear` is called, `detourShape` and `directions` should be empty", async () => {
    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(detourShapeFactory.build())

    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, shapePointFactory.build()))
    act(() => addWaypoint(result.current, shapePointFactory.build()))
    act(() => addWaypoint(result.current, shapePointFactory.build()))

    await waitFor(() => {
      expect(result.current.directions).not.toBeUndefined()
      expect(result.current.detourShape).not.toHaveLength(0)
    })

    act(() => clear(result.current))

    expect(result.current.waypoints).toHaveLength(0)
    expect(result.current.directions).toBeUndefined()
    expect(result.current.detourShape).toHaveLength(0)
  })

  test("when `startPoint` is null, `canUndo` is `false`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    expect(result.current.startPoint).toBeNull()
    expect(result.current.canUndo).toBe(false)
  })

  test("when `startPoint` is set, `canUndo` is `true`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))

    expect(result.current.startPoint).not.toBeNull()
    expect(result.current.canUndo).toBe(true)
  })

  test("when `endPoint` is set, `canUndo` is `true`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))
    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toBeUndefined()
    })

    expect(result.current.endPoint).not.toBeNull()
    expect(result.current.canUndo).toBe(true)
  })

  test("when `endPoint` is set, `missedStops` is filled in", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const missedStops = stopFactory.buildList(3)

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ missedStops }))

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))
    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toBeUndefined()
    })

    expect(result.current.missedStops).toBe(missedStops)
  })

  test("when `endPoint` is set, `routeSegments` is filled in", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const routeSegments = routeSegmentsFactory.build()

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ routeSegments }))

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))
    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toBeUndefined()
    })

    expect(result.current.routeSegments).toEqual(routeSegments)
  })

  test("when `endPoint` is undone, `missedStops` is cleared", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    const missedStops = stopFactory.buildList(3)

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ missedStops }))

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))
    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.missedStops).not.toBeUndefined()
    })

    act(() => undo(result.current))

    await waitFor(() => {
      expect(result.current.missedStops).toBeUndefined()
    })
  })

  test("when `endPoint` is undone, `routeSegments` is cleared", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))
    act(() => addConnectionPoint(result.current, { lat: 0, lon: 0 }))

    await waitFor(() => {
      expect(result.current.routeSegments).not.toBeUndefined()
    })

    act(() => undo(result.current))

    await waitFor(() => {
      expect(result.current.routeSegments).toBeUndefined()
    })
  })

  test("initially, `finishDetour` is `undefined`", () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    expect(
      result.current.state === DetourState.Edit && result.current.finishDetour
    ).toBeUndefined()
  })

  test("initially, `state` is `Edit`", () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    expect(result.current.state).toBe(DetourState.Edit)
  })

  test("when `endPoint` is set, `finishDetour` is defined", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, shapePointFactory.build()))
    act(() => addConnectionPoint(result.current, shapePointFactory.build()))

    await waitFor(() =>
      expect(
        result.current.state === DetourState.Edit && result.current.finishDetour
      ).toBeDefined()
    )
  })

  test("calling `finishDetour`, sets `state` to `Finished`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, shapePointFactory.build()))
    act(() => addConnectionPoint(result.current, shapePointFactory.build()))

    act(() => {
      finishDetour(result.current)
    })

    await waitFor(() => expect(result.current.state).toBe(DetourState.Finished))
  })

  test("calling `finishedDetour`, sets `state` to `Finished`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, shapePointFactory.build()))
    act(() => addConnectionPoint(result.current, shapePointFactory.build()))

    await waitFor(() => expect(result.current.state).toBe(DetourState.Edit))

    act(() => {
      finishDetour(result.current)
    })

    await waitFor(() => expect(result.current.state).toBe(DetourState.Finished))
  })

  test("calling `editDetour`, sets `state` to `Edit`", async () => {
    const { result } = renderHook(useDetourWithFakeRoutePattern)

    act(() => addConnectionPoint(result.current, shapePointFactory.build()))
    act(() => addConnectionPoint(result.current, shapePointFactory.build()))

    act(() => {
      finishDetour(result.current)
    })
    await waitFor(() => expect(result.current.state).toBe(DetourState.Finished))

    act(() => {
      editDetour(result.current)
    })
    await waitFor(() => expect(result.current.state).toBe(DetourState.Edit))
  })
})

/*
const renderFinishedDetour = () => {
  const renderResult = renderHook(useDetourWithFakeRoutePattern)

  act(() =>
    renderResult.addConnectionPoint(
      renderResult.result.current,
      shapePointFactory.build()
    )
  )
  act(() =>
    renderResult.addConnectionPoint(
      renderResult.result.current,
      shapePointFactory.build()
    )
  )

  act(() => {
    renderResult.result.current.finishDetour?.()
  })

  return renderResult
}
   */
