import { useCallback } from "react"
import { fetchDetour } from "../api"
import { createDetourMachine } from "../models/createDetourMachine"
import { DetourId } from "../models/detoursList"
import { isValidSnapshot } from "../util/isValidSnapshot"
import { isErr } from "../util/result"
import { useApiCall } from "./useApiCall"

export const useLoadDetour = (detourId: DetourId | undefined) => {
  const { result: detour, isLoading } = useApiCall({
    apiCall: useCallback(async () => {
      if (detourId === undefined) {
        return undefined
      }
      const detourResponse = await fetchDetour(detourId)

      if (isErr(detourResponse)) {
        return null
      }

      const snapshot = isValidSnapshot(
        createDetourMachine,
        detourResponse.ok.state
      )
      if (isErr(snapshot)) {
        return undefined
      }
      return detourResponse.ok
    }, [detourId]),
  })

  return { detour, isLoading }
}
