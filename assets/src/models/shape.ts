import { LoadableShapes, RouteId, Shape, ShapesByRouteId } from "../schedule"

export const loadedShapes = (
  shapesByRouteId: ShapesByRouteId,
  routeIds: RouteId[]
): Shape[] =>
  routeIds.reduce((acc: Shape[], routeId: RouteId) => {
    const loadableShapes: LoadableShapes = shapesByRouteId[routeId]
    if (loadableShapes === undefined || loadableShapes === null) {
      return acc
    }
    return acc.concat(loadableShapes)
  }, [])
