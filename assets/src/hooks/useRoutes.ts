import { useEffect, useState } from "react"
import { fetchRoutes } from "../api"
import { Route, UserToken } from "../skate"

const useRoutes = (userToken?: UserToken): Route[] | null => {
  const [routes, setRoutes] = useState<Route[] | null>(null)
  useEffect(() => {
    fetchRoutes(userToken).then((newRoutes: Route[]) => setRoutes(newRoutes))
  }, [])
  return routes
}

export default useRoutes
