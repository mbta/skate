import { useEffect, useState } from "react"
import { fetchScheduleBlock, fetchScheduleRun } from "../api"
import { ScheduleBlock, ScheduleRun, Run } from "../minischedule"
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
): ScheduleRun | null | undefined => {
  const [scheduleRun, setScheduleRun] = useState<
    ScheduleRun | null | undefined
  >(undefined)
  useEffect(() => {
    fetchScheduleRun(tripId, runId).then(setScheduleRun)
  }, [tripId, runId])
  return scheduleRun
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
    Promise.all(currentTripIds.map((tripId) => fetchScheduleRun(tripId, null)))
      .then((scheduleRuns) =>
        scheduleRuns.map((scheduleRun) =>
          scheduleRun !== null ? scheduleRun.run : null
        )
      )
      .then(setRuns)
  }, [currentTripIds])

  return runs
}

/**
 * undefined means loading
 * null means loaded, but there was no run found
 */
export const useMinischeduleBlock = (
  tripId: TripId
): ScheduleBlock | null | undefined => {
  const [scheduledBlock, setScheduledBlock] = useState<
    ScheduleBlock | null | undefined
  >(undefined)
  useEffect(() => {
    fetchScheduleBlock(tripId).then(setScheduledBlock)
  }, [tripId])
  return scheduledBlock
}
