import { useEffect, useState } from "react"
import { fetchDetours } from "../api"
import { isOk } from "../util/result"
import { SimpleDetourData } from "../models/detour"

/**
 * A hook to fetch all detours, organized by "Active", "Drafts", "Past"
 * @returns a list of {@link SimpleDetours}, or null if loading.
 */
export const useAllDetours = (): SimpleDetourData | null => {
  const [detours, setDetours] = useState<SimpleDetourData | null>(null)

  useEffect(() => {
    fetchDetours().then((detours) => {
      return isOk(detours) && setDetours(detours.ok)
    })
  }, [])

  return detours
}
