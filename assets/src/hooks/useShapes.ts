import { useEffect, useState } from "react"
import { fetchShapeForRoute, fetchShapeForTrip } from "../api"
import { flatten } from "../helpers/array"
import { isASubwayRoute, subwayRouteShapes } from "../models/subwayRoute"
import { ByRouteId, RouteId, Shape, TripId } from "../schedule"

// An undefined value indicates that the shapes need to be loaded
// A null value indicates that we are currently loading the shapes
type LoadableShapes = Shape[] | null | undefined

export const useRouteShapes = (selectedRouteIds: RouteId[]): Shape[] => {
  const [shapesByRouteId, setShapesByRouteId] = useState<
    ByRouteId<LoadableShapes>
  >({})

  const setLoadingShapesForRoute = (routeId: RouteId) => {
    setShapesByRouteId((previousShapesByRouteId) => ({
      ...previousShapesByRouteId,
      [routeId]: null,
    }))
  }

  const setShapesForRoute = (routeId: RouteId, shapes: Shape[]) => {
    setShapesByRouteId((previousShapesByRouteId) => ({
      ...previousShapesByRouteId,
      [routeId]: shapes,
    }))
  }

  useEffect(() => {
    selectedRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in shapesByRouteId)) {
        setLoadingShapesForRoute(routeId)

        if (isASubwayRoute(routeId)) {
          setShapesForRoute(routeId, subwayRouteShapes(routeId))
        } else {
          fetchShapeForRoute(routeId).then((shapes: Shape[]) =>
            setShapesForRoute(routeId, shapes)
          )
        }
      }
    })
  }, [selectedRouteIds, shapesByRouteId])

  return loadedShapes(shapesByRouteId, selectedRouteIds)
}

export const useTripShape = (tripId: TripId | null): Shape[] => {
  // null means loading
  const [shape, setShape] = useState<Shape | null>(null)

  useEffect(() => {
    if (tripId !== null) {
      fetchShapeForTrip(tripId).then((shapeResult: Shape | null) =>
        setShape(shapeResult)
      )
    }
  }, [tripId])

  return shape === null ? [] : [shape]
}

const loadedShapes = (
  shapesByRouteId: ByRouteId<LoadableShapes>,
  routeIds: RouteId[]
): Shape[] =>
  flatten(
    routeIds.map((routeId: RouteId): Shape[] => {
      const loadableShapes: LoadableShapes = shapesByRouteId[routeId]
      if (loadableShapes === undefined || loadableShapes === null) {
        return []
      } else {
        return loadableShapes
      }
    })
  )
