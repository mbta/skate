import { useEffect, useState } from "react"
import { fetchShapeForRoute } from "../api"
import { RouteId, Shape, ShapesByRouteId } from "../schedule"

const useRouteShapes = (
  selectedShuttleRouteIds: RouteId[]
): ShapesByRouteId => {
  const [shapesByRouteId, setShapesByRouteId] = useState<ShapesByRouteId>({})

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
    selectedShuttleRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in shapesByRouteId)) {
        setLoadingShapesForRoute(routeId)

        fetchShapeForRoute(routeId).then((shapes: Shape[]) =>
          setShapesForRoute(routeId, shapes)
        )
      }
    })
  }, [selectedShuttleRouteIds, shapesByRouteId])

  return shapesByRouteId
}

export default useRouteShapes
