import { useEffect, useState, useContext } from "react"
import { fetchSwings } from "../api"
import { RouteId, Swing } from "../schedule.d"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { allOpenRouteIds } from "../models/routeTab"
import { equalByElements } from "../helpers/array"

const useSwings = (): Swing[] | null => {
  const [{ routeTabs }] = useContext(StateDispatchContext)
  const [swings, setSwings] = useState<Swing[] | null>(null)
  const [routeIds, setRouteIds] = useState<RouteId[]>(
    allOpenRouteIds(routeTabs)
  )

  const newRouteIds = routeTabs.find((v) => v.isCurrentTab)?.selectedRouteIds

  if (newRouteIds && !equalByElements(routeIds, newRouteIds)) {
    setRouteIds(newRouteIds)
  }

  useEffect(() => {
    fetchSwings(routeIds).then(setSwings)
  }, [routeIds])

  return swings
}

export default useSwings
