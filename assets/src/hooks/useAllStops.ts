import { useEffect, useState } from "react"
import { Stop } from "../schedule"
import { fetchAllStops } from "../api"

export const useAllStops = (): Stop[] | null => {
  // null means loading
  const [stops, setStops] = useState<Stop[] | null>(null)

  useEffect(() => {
    fetchAllStops().then(setStops)
  }, [])

  return stops
}
