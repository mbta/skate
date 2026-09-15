import { useCallback } from "react"
import { RttTab } from "./types"

export interface UseRttQueueTabsOptions {
  tab: RttTab
  newIncomingCount: number
  onTabChange?: (tab: RttTab) => void
  dispatchTabChange?: (tab: RttTab) => void
}

export const useRttQueueTabs = ({
  tab,
  newIncomingCount,
  onTabChange,
  dispatchTabChange,
}: UseRttQueueTabsOptions) => {
  const handleTabClick = useCallback(
    (newTab: RttTab) => {
      dispatchTabChange?.(newTab)
      onTabChange?.(newTab)
    },
    [dispatchTabChange, onTabChange]
  )

  return {
    tab,
    newIncomingCount,
    handleTabClick,
  }
}
