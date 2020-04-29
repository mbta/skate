import React from "react"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../hooks/useMinischedule"
import { Block, Run } from "../../minischedule"
import { TripId } from "../../schedule"
import Loading from "../loading"

export interface Props {
  activeTripId: TripId
}
export const MinischeduleRun = ({ activeTripId }: Props) => {
  const run: Run | null = useMinischeduleRun(activeTripId)
  return run === null ? <Loading /> : <div>{JSON.stringify(run)}</div>
}

export const MinischeduleBlock = ({ activeTripId }: Props) => {
  const block: Block | null = useMinischeduleBlock(activeTripId)
  return block === null ? <Loading /> : <div>{JSON.stringify(block)}</div>
}
