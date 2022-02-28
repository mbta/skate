import { useEffect, useState, useContext } from "react"
import { fetchSwings } from "../api"
import { Swing } from "../schedule.d"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { allOpenRouteIds } from "../models/routeTab"

const useSwings = (): Swing[] | null => {
  const [{ routeTabs }] = useContext(StateDispatchContext)
  const [swings, setSwings] = useState<Swing[] | null>(null)

  const routeIds = allOpenRouteIds(routeTabs)

  useEffect(() => {
    fetchSwings(routeIds).then((newSwings: Swing[] | null) => {
      setSwings(newSwings)
    })
  }, [JSON.stringify(routeIds)])
  return swings
}

export default useSwings
