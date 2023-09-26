import shapesBlue from "../data/shapesBlue"
import shapesGreen from "../data/shapesGreen"
import shapesMattapan from "../data/shapesMattapan"
import shapesOrange from "../data/shapesOrange"
import shapesRed from "../data/shapesRed"
import { RouteId, Shape } from "../schedule"

type SubwayRouteId = "Blue" | "Green" | "Orange" | "Red" | "Mattapan"

export interface SubwayRoute {
  id: SubwayRouteId
  name: string
  gtfsRouteIds: RouteId[]
  shapes: Shape[]
}

export const subwayRoutes: Record<SubwayRouteId, SubwayRoute> = {
  Blue: {
    id: "Blue",
    name: "Blue Line",
    gtfsRouteIds: ["Blue"],
    shapes: shapesBlue,
  },
  Green: {
    id: "Green",
    name: "Green Line",
    gtfsRouteIds: ["Green-B", "Green-C", "Green-D", "Green-E"],
    shapes: shapesGreen,
  },
  Orange: {
    id: "Orange",
    name: "Orange Line",
    gtfsRouteIds: ["Orange"],
    shapes: shapesOrange,
  },
  Red: {
    id: "Red",
    name: "Red Line",
    gtfsRouteIds: ["Red"],
    shapes: shapesRed,
  },
  Mattapan: {
    id: "Mattapan",
    name: "Mattapan Line",
    gtfsRouteIds: ["Mattapan"],
    shapes: shapesMattapan,
  },
}

const subwayRouteIds: RouteId[] = Object.keys(subwayRoutes)

export const isASubwayRoute = (routeId: RouteId): routeId is SubwayRouteId =>
  subwayRouteIds.includes(routeId)

export const subwayRouteShapes = (routeId: SubwayRouteId): Shape[] => {
  const route = subwayRoutes[routeId]

  return route ? route.shapes : []
}
