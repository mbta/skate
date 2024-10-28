import { useEffect, useState } from "react"
import { fetchStations } from "../api"
import { Stop } from "../schedule"

export const useStations = (): Stop[] | null => {
  // null means loading
  const [stations, setStations] = useState<Stop[] | null>(null)

  useEffect(() => {
    fetchStations().then(setStations)
  }, [])

  return stations
}
