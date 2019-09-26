import {
  ByRouteId,
  LoadableShapes,
  RouteId,
  Shape,
  ShapesByRouteId,
} from "../schedule"

export type LoadedShapesByRouteId = ByRouteId<Shape[]>

export const loadedShapes = (
  shapesByRouteId: ShapesByRouteId,
  routeIds: RouteId[]
): LoadedShapesByRouteId =>
  routeIds.reduce(
    (acc: LoadedShapesByRouteId, routeId: RouteId) => {
      const loadableShapes: LoadableShapes = shapesByRouteId[routeId]
      if (loadableShapes === undefined || loadableShapes === null) {
        return acc
      }
      return { ...acc, [routeId]: loadableShapes }
    },
    {} as LoadedShapesByRouteId
  )
