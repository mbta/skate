import React, { createContext, ReactElement, useContext } from "react"
import { Route, RouteId } from "../schedule"

const RoutesContext = createContext<Route[] | null>(null)

export const useRoute = (routeId: RouteId | null | undefined): Route | null => {
  const routes: Route[] | null = useContext(RoutesContext)
  return (routes || []).find((route) => route.id === routeId) || null
}

export const RoutesProvider = ({
  routes,
  children,
}: {
  routes: Route[] | null
  children: ReactElement<HTMLElement>
}) => {
  return (
    <RoutesContext.Provider value={routes}>{children}</RoutesContext.Provider>
  )
}

export default RoutesContext
