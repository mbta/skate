import stopsBlue from "../data/stopsBlue"
import stopsGreen from "../data/stopsGreen"
import stopsMattapan from "../data/stopsMattapan"
import stopsRed from "../data/stopsOrange"
import stopsOrange from "../data/stopsOrange"
import { RouteId, Shape, Stop } from "../schedule"

type SubwayRouteId = "Blue" | "Green" | "Orange" | "Red" | "Mattapan"

export interface SubwayRoute {
  id: SubwayRouteId
  name: string
  gtfsRouteIds: RouteId[]
  className: string
  stops: Stop[]
}

export const subwayRoutes: Record<SubwayRouteId, SubwayRoute> = {
  Blue: {
    id: "Blue",
    name: "Blue Line",
    gtfsRouteIds: ["Blue"],
    className: "route-shape--rail route-shape--blue",
    stops: stopsBlue,
  },
  Green: {
    id: "Green",
    name: "Green Line",
    gtfsRouteIds: ["Green-B", "Green-C", "Green-D", "Green-E"],
    className: "route-shape--rail route-shape--green",
    stops: stopsGreen,
  },
  Orange: {
    id: "Orange",
    name: "Orange Line",
    gtfsRouteIds: ["Orange"],
    className: "route-shape--rail route-shape--orange",
    stops: stopsOrange,
  },
  Red: {
    id: "Red",
    name: "Red Line",
    gtfsRouteIds: ["Red"],
    className: "route-shape--rail route-shape--red",
    stops: stopsRed,
  },
  Mattapan: {
    id: "Mattapan",
    name: "Mattapan Line",
    gtfsRouteIds: ["Mattapan"],
    className: "route-shape--rail route-shape--red",
    stops: stopsMattapan,
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

  return {
    ...apiShape,
    className: subwayRoute.className,
    stops: subwayRoute.stops,
  }
}
