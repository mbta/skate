import { useEffect, useState } from "react"
import { fetchShuttleRoutes } from "../api"
import { Route } from "../schedule.d"

const byName = (a: Route, b: Route): number => {
  const aName: string = a.name.toLowerCase()
  const bName: string = b.name.toLowerCase()

  if (aName < bName) {
    return -1
  }
  if (aName > bName) {
    return 1
  }
  return 0
}

export const sortByName = (unsortedRoutes: Route[]): Route[] =>
  unsortedRoutes.sort(byName)

const useShuttleRoutes = (): Route[] | null => {
  const [shuttleRoutes, setShuttleRoutes] = useState<Route[] | null>(null)
  useEffect(() => {
    fetchShuttleRoutes()
      .then(sortByName)
      .then(setShuttleRoutes)
  }, [])
  return shuttleRoutes
}

export default useShuttleRoutes
