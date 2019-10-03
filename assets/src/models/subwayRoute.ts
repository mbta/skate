import shapesBlue from "../data/shapesBlue"
import shapesGreen from "../data/shapesGreen"
import shapesOrange from "../data/shapesOrange"
import shapesRed from "../data/shapesRed"
import { RouteId, Shape } from "../schedule"

export interface SubwayRoute {
  id: RouteId
  name: string
  shapes: Shape[]
}

export const subwayRoutes: SubwayRoute[] = [
  { id: "Blue", name: "Blue Line", shapes: shapesBlue },
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
]

export const subwayRouteIds: RouteId[] = subwayRoutes.map(route => route.id)

export const subwayRouteShapes = (routeIds: RouteId[]): Shape[] =>
  subwayRoutes
    .filter(route => routeIds.includes(route.id))
    .reduce((acc: Shape[], route: SubwayRoute) => acc.concat(route.shapes), [])
