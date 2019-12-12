import shapesBlue from "../data/shapesBlue"
import shapesGreen from "../data/shapesGreen"
import shapesMattapan from "../data/shapesMattapan"
import shapesOrange from "../data/shapesOrange"
import shapesRed from "../data/shapesRed"
import { RouteId, Shape } from "../schedule"

export interface SubwayRoute {
  id: RouteId
  name: string
  shapes: Shape[]
}

export const subwayRoutes: SubwayRoute[] = [
  {
    id: "Blue",
    name: "Blue Line",
    shapes: shapesBlue,
  },
  {
    id: "Green",
    name: "Green Line",
    shapes: shapesGreen,
  },
  {
    id: "Orange",
    name: "Orange Line",
    shapes: shapesOrange,
  },
  {
    id: "Red",
    name: "Red Line",
    shapes: shapesRed,
  },
  {
    id: "Mattapan",
    name: "Mattapan Line",
    shapes: shapesMattapan,
  },
]

const subwayRouteIds: RouteId[] = subwayRoutes.map(({ id }) => id)

export const isASubwayRoute = (routeId: RouteId): boolean =>
  subwayRouteIds.includes(routeId)

export const subwayRouteShapes = (routeId: RouteId): Shape[] => {
  const route = subwayRoutes.find(byId(routeId))

  return route ? route.shapes : []
}

const byId = (routeId: RouteId) => (subwayRoute: SubwayRoute): boolean =>
  subwayRoute.id === routeId
