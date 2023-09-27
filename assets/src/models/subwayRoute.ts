import { RouteId, Shape } from "../schedule"

type SubwayRouteId = "Blue" | "Green" | "Orange" | "Red" | "Mattapan"

export interface SubwayRoute {
  id: SubwayRouteId
  name: string
  gtfsRouteIds: RouteId[]
  className: string
}

export const subwayRoutes: Record<SubwayRouteId, SubwayRoute> = {
  Blue: {
    id: "Blue",
    name: "Blue Line",
    gtfsRouteIds: ["Blue"],
    className: "route-shape--rail route-shape--blue",
  },
  Green: {
    id: "Green",
    name: "Green Line",
    gtfsRouteIds: ["Green-B", "Green-C", "Green-D", "Green-E"],
    className: "route-shape--rail route-shape--green",
  },
  Orange: {
    id: "Orange",
    name: "Orange Line",
    gtfsRouteIds: ["Orange"],
    className: "route-shape--rail route-shape--orange",
  },
  Red: {
    id: "Red",
    name: "Red Line",
    gtfsRouteIds: ["Red"],
    className: "route-shape--rail route-shape--red",
  },
  Mattapan: {
    id: "Mattapan",
    name: "Mattapan Line",
    gtfsRouteIds: ["Mattapan"],
    className: "route-shape--rail route-shape--red",
  },
}

const subwayRouteIds: RouteId[] = Object.keys(subwayRoutes)

export const isASubwayRoute = (routeId: RouteId): routeId is SubwayRouteId =>
  subwayRouteIds.includes(routeId)

export const enhanceShapeForSubwayRoute = (
  apiShape: Shape,
  subwayRouteId: SubwayRouteId
): Shape => {
  const subwayRoute = subwayRoutes[subwayRouteId]

  return { ...apiShape, className: subwayRoute.className }
}
