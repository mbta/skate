import { useEffect, useState } from "react"
import { fetchShuttles } from "../api"
import { Route } from "../schedule.d"

const useShuttles = (): Route[] | null => {
  const [shuttles, setShuttles] = useState<Route[] | null>(null)
  useEffect(() => {
    fetchShuttles().then(setShuttles)
  }, [])
  return shuttles
}

export default useShuttles
