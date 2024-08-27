import { useEffect, useState } from "react"
import { fetchDetours } from "../api"
import { Detour } from "../components/detourListPage"
import { isOk } from "../util/result"

/**
 * A hook to fetch all detours, organized by "Active", "Drafts", "Past"
 * @returns a list of {@link Detour}, or null if loading.
 */
export const useAllDetours = (): Detour[] | null => {
  const [detours, setDetours] = useState<Detour[] | null>(null)

  useEffect(() => {
    console.debug("in the useeffect")
    fetchDetours().then((detours) => {
      console.debug("detours in hook: ", detours)
      return isOk(detours) && setDetours(detours.ok)
    })
  }, [])

  return detours
}
