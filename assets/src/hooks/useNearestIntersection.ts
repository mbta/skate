import { useEffect, useState } from "react"
import { fetchNearestIntersection } from "../api"

export const useNearestIntersection = (
  latitude: number,
  longitude: number
): string | null => {
  const [result, setResult] = useState<string | null>(null)
  useEffect(() => {
    fetchNearestIntersection(latitude, longitude).then(setResult)
  }, [latitude, longitude])
  return result
}
