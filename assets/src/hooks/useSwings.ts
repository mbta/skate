import { useEffect, useState } from "react"
import { fetchSwings } from "../api"
import { Swing } from "../schedule.d"

const useSwings = (): Swing[] | null => {
  const [swings, setSwings] = useState<Swing[] | null>(null)
  useEffect(() => {
    fetchSwings().then((newSwings: Swing[] | null) => setSwings(newSwings))
  }, [])
  return swings
}

export default useSwings
