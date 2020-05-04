import { useEffect, useState } from "react"
import { fetchMinischeduleBlock, fetchMinischeduleRun } from "../api"
import { Block, Run } from "../minischedule"
import { TripId } from "../schedule"

export const useMinischeduleRun = (tripId: TripId): Run | null => {
  const [run, setRun] = useState<Run | null>(null)
  useEffect(() => {
    fetchMinischeduleRun(tripId).then(setRun)
  }, [tripId])
  return run
}

export const useMinischeduleBlock = (tripId: TripId): Block | null => {
  const [block, setBlock] = useState<Block | null>(null)
  useEffect(() => {
    fetchMinischeduleBlock(tripId).then(setBlock)
  }, [tripId])
  return block
}
