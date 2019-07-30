import { useEffect, useState } from "react"
import { fetchRoutes } from "../api"
import { Route } from "../schedule.d"

const useRoutes = (): Route[] | null => {
  const [routes, setRoutes] = useState<Route[] | null>(null)
  useEffect(() => {
    fetchRoutes().then((newRoutes: Route[]) => setRoutes(newRoutes))
  }, [])
  return routes
}

export default useRoutes
