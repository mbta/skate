import { useEffect, useState } from "react"
import { fetchShuttleRoutes } from "../api"
import { Route } from "../schedule.d"

const useShuttleRoutes = (): Route[] | null => {
  const [shuttles, setShuttles] = useState<Route[] | null>(null)
  useEffect(() => {
    fetchShuttleRoutes().then(setShuttles)
  }, [])
  return shuttles
}

export default useShuttleRoutes
