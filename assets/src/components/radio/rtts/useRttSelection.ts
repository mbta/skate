import { useMemo, useCallback } from "react"
import { RttCall } from "./types"

export interface UseRttSelectionOptions {
  selectedCallId?: string | null
  activeCallId?: string | null
  incomingCalls: RttCall[]
  pastCalls: RttCall[]
  onSelectCall?: (call: RttCall) => void
  dispatchSelectCall?: (callId: string) => void
}

export const useRttSelection = ({
  selectedCallId,
  activeCallId,
  incomingCalls,
  pastCalls,
  onSelectCall,
  dispatchSelectCall,
}: UseRttSelectionOptions) => {
  const selectedCall = useMemo(() => {
    if (!selectedCallId) return null
    return (
      incomingCalls.find((c) => c.id === selectedCallId) ??
      pastCalls.find((c) => c.id === selectedCallId) ??
      null
    )
  }, [incomingCalls, pastCalls, selectedCallId])

  const activeCall = useMemo(() => {
    if (!activeCallId) return null
    return incomingCalls.find((c) => c.id === activeCallId) ?? null
  }, [incomingCalls, activeCallId])

  const isSelectedLive = Boolean(
    selectedCall &&
    (selectedCall.id === activeCallId || selectedCall.status === "active")
  )

  const handleSelectCall = useCallback(
    (call: RttCall) => {
      dispatchSelectCall?.(call.id)
      onSelectCall?.(call)
    },
    [dispatchSelectCall, onSelectCall]
  )

  return {
    selectedCall,
    activeCall,
    isSelectedLive,
    handleSelectCall,
  }
}
