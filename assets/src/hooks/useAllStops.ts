import { useEffect, useState } from "react"
import { Stop } from "../schedule"
import { fetchAllStops } from "../api"

/**
 * A hook to fetch all stops (stations + stops)
 * @returns a list of {@link Stop}, or null if loading.
 */
export const useAllStops = (): Stop[] | null => {
  const [stops, setStops] = useState<Stop[] | null>(null)

  useEffect(() => {
    fetchAllStops().then(setStops)
  }, [])

  return stops
}
