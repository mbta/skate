import { useEffect, useState } from "react"
import { fetchShapeForRoute } from "../api"
import { subwayRouteIds } from "../models/subwayRoute"
import { RouteId, Shape, ShapesByRouteId } from "../schedule"

const useRouteShapes = (selectedRouteIds: RouteId[]): ShapesByRouteId => {
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
    selectedRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in shapesByRouteId) && !subwayRouteIds.includes(routeId)) {
        setLoadingShapesForRoute(routeId)

        fetchShapeForRoute(routeId).then((shapes: Shape[]) =>
          setShapesForRoute(routeId, shapes)
        )
      }
    })
  }, [selectedRouteIds, shapesByRouteId])

  return shapesByRouteId
}

export default useRouteShapes
