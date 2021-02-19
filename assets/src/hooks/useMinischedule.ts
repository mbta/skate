import { useEffect, useState } from "react"
import { fetchMinischeduleBlock, fetchMinischeduleRun } from "../api"
import { Block, Run } from "../minischedule"
import { TripId } from "../schedule"

/**
 * undefined means loading
 * null means loaded, but there was no run found
 */
export const useMinischeduleRun = (tripId: TripId): Run | null | undefined => {
  const [run, setRun] = useState<Run | null | undefined>(undefined)
  useEffect(() => {
    fetchMinischeduleRun(tripId).then(setRun)
  }, [tripId])
  return run
}

/**
 * undefined means loading
 * null means loaded, but there was no run found
 */
export const useMinischeduleRuns = (
  tripIds: TripId[]
): (Run | null)[] | undefined => {
  const [runs, setRuns] = useState<(Run | null)[] | undefined>(undefined)
  useEffect(() => {
    Promise.all(tripIds.map((tripId) => fetchMinischeduleRun(tripId))).then(
      setRuns
    )
  }, [JSON.stringify(tripIds)])
  return runs
}

/**
 * undefined means loading
 * null means loaded, but there was no run found
 */
export const useMinischeduleBlock = (
  tripId: TripId
): Block | null | undefined => {
  const [block, setBlock] = useState<Block | null | undefined>(undefined)
  useEffect(() => {
    fetchMinischeduleBlock(tripId).then(setBlock)
  }, [tripId])
  return block
}
