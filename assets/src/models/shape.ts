import {
  LoadableShapes,
  LoadableShapesByRouteId,
  RouteId,
  Shape,
} from "../schedule"

export const loadedShapes = (
  shapesByRouteId: LoadableShapesByRouteId,
  routeIds: RouteId[]
): Shape[] =>
  routeIds.reduce((acc: Shape[], routeId: RouteId) => {
    const loadableShapes: LoadableShapes = shapesByRouteId[routeId]
    if (loadableShapes === undefined || loadableShapes === null) {
      return acc
    }
    return acc.concat(loadableShapes)
  }, [])
