import blueLine60Shape from "../data/shapeBlue-6-0"
import blueLine61Shape from "../data/shapeBlue-6-1"
import greenLineB30Shape from "../data/shapeGreen-B-3-0"
import greenLineB31Shape from "../data/shapeGreen-B-3-1"
import greenLineC00Shape from "../data/shapeGreen-C-0-0"
import greenLineC01Shape from "../data/shapeGreen-C-0-1"
import greenLineC10Shape from "../data/shapeGreen-C-1-0"
import greenLineC11Shape from "../data/shapeGreen-C-1-1"
import greenLineD00Shape from "../data/shapeGreen-D-0-0"
import greenLineD01Shape from "../data/shapeGreen-D-0-1"
import greenLineD11Shape from "../data/shapeGreen-D-1-1"
import greenLineD20Shape from "../data/shapeGreen-D-2-0"
import greenLineD21Shape from "../data/shapeGreen-D-2-1"
import greenLineD40Shape from "../data/shapeGreen-D-4-0"
import greenLineD41Shape from "../data/shapeGreen-D-4-1"
import greenLineD51Shape from "../data/shapeGreen-D-5-1"
import greenLineD60Shape from "../data/shapeGreen-D-6-0"
import greenLineD61Shape from "../data/shapeGreen-D-6-1"
import greenLineE00Shape from "../data/shapeGreen-E-0-0"
import greenLineE01Shape from "../data/shapeGreen-E-0-1"
import orangeLine30Shape from "../data/shapeOrange-3-0"
import orangeLine31Shape from "../data/shapeOrange-3-1"
import redLine10Shape from "../data/shapeRed-1-0"
import redLine30Shape from "../data/shapeRed-3-0"
import redLine31Shape from "../data/shapeRed-3-1"
import { RouteId, Shape } from "../schedule"

export interface SubwayRoute {
  id: RouteId
  name: string
  shapes: Shape[]
}

export const subwayRoutes: SubwayRoute[] = [
  { id: "Blue", name: "Blue Line", shapes: [blueLine60Shape, blueLine61Shape] },
  {
    id: "Green",
    name: "Green Line",
    shapes: [
      greenLineB30Shape,
      greenLineB31Shape,
      greenLineC00Shape,
      greenLineC01Shape,
      greenLineC10Shape,
      greenLineC11Shape,
      greenLineD00Shape,
      greenLineD01Shape,
      greenLineD11Shape,
      greenLineD20Shape,
      greenLineD21Shape,
      greenLineD40Shape,
      greenLineD41Shape,
      greenLineD51Shape,
      greenLineD61Shape,
      greenLineD60Shape,
      greenLineE00Shape,
      greenLineE01Shape,
    ],
  },
  {
    id: "Orange",
    name: "Orange Line",
    shapes: [orangeLine30Shape, orangeLine31Shape],
  },
  {
    id: "Red",
    name: "Red Line",
    shapes: [redLine10Shape, redLine30Shape, redLine31Shape],
  },
]

export const subwayRouteIds: RouteId[] = subwayRoutes.map(route => route.id)

export const subwayRouteShapes = (routeIds: RouteId[]): Shape[] =>
  subwayRoutes
    .filter(route => routeIds.includes(route.id))
    .reduce((acc: Shape[], route: SubwayRoute) => acc.concat(route.shapes), [])
