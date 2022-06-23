import { useEffect, useState } from "react"
import { fetchScheduleBlock, fetchScheduleRun } from "../api"
import { Block, Run } from "../minischedule"
import { TripId } from "../schedule"
import { RunId } from "../realtime"
import { equalByElements } from "../helpers/array"

/**
 * undefined means loading
 * null means loaded, but there was no run found
 */
export const useMinischeduleRun = (
  tripId: TripId,
  runId: RunId
): Run | null | undefined => {
  const [run, setRun] = useState<Run | null | undefined>(undefined)
  useEffect(() => {
    fetchScheduleRun(tripId, runId).then(setRun)
  }, [tripId, runId])
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
  const [currentTripIds, setCurrentTripIds] = useState<TripId[]>(tripIds)

  if (!equalByElements(tripIds, currentTripIds)) {
    setCurrentTripIds(tripIds)
  }

  useEffect(() => {
    Promise.all(
      currentTripIds.map((tripId) => fetchScheduleRun(tripId, null))
    ).then(setRuns)
  }, [currentTripIds])

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
    fetchScheduleBlock(tripId).then(setBlock)
  }, [tripId])
  return block
}
