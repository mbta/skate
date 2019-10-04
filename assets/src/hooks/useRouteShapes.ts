import { useEffect, useState } from "react"
import { fetchShapeForRoute } from "../api"
import { isASubwayRoute, subwayRouteShapes } from "../models/subwayRoute"
import { LoadableShapesByRouteId, RouteId, Shape } from "../schedule"

const useRouteShapes = (
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

export default useRouteShapes
