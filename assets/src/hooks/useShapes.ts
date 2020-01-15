import { useEffect, useState } from "react"
import { fetchShapeForRoute, fetchShapeForTrip } from "../api"
import { isASubwayRoute, subwayRouteShapes } from "../models/subwayRoute"
import { LoadableShapesByRouteId, RouteId, Shape, TripId } from "../schedule"

export const useRouteShapes = (
  selectedRouteIds: RouteId[]
): LoadableShapesByRouteId => {
  const [shapesByRouteId, setShapesByRouteId] = useState<
    LoadableShapesByRouteId
  >({})

  const setLoadingShapesForRoute = (routeId: RouteId) => {
    setShapesByRouteId(previousShapesByRouteId => ({
      ...previousShapesByRouteId,
      [routeId]: null,
    }))
  }

  const setShapesForRoute = (routeId: RouteId, shapes: Shape[]) => {
    setShapesByRouteId(previousShapesByRouteId => ({
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

  return shapesByRouteId
}

/** null means loading
 */
export const useTripShape = (tripId: TripId | null): Shape | null => {
  const [shape, setShape] = useState<Shape | null>(null)

  useEffect(() => {
    if (tripId !== null) {
      fetchShapeForTrip(tripId).then((shapeResult: Shape | null) =>
        setShape(shapeResult)
      )
    }
  }, [])

  return shape
}
