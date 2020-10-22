import { createContext, useContext } from "react"
import { Route, RouteId } from "../schedule"

type RoutesData = Route[] | null

const RoutesContext = createContext(null as RoutesData)

export const useRoute = (routeId: RouteId | null | undefined): Route | null => {
  const routes: Route[] | null = useContext(RoutesContext)
  return (routes || []).find((route) => route.id === routeId) || null
}

export default RoutesContext
