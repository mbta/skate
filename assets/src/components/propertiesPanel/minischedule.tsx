import React, { ReactElement } from "react"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../hooks/useMinischedule"
import { Block, Break, Piece, Run, Trip } from "../../minischedule"
import { TripId } from "../../schedule"
import Loading from "../loading"

export interface Props {
  activeTripId: TripId
}
export const MinischeduleRun = ({ activeTripId }: Props): ReactElement => {
  const run: Run | null | undefined = useMinischeduleRun(activeTripId)
  if (run === undefined) {
    return <Loading />
  } else if (run === null) {
    return <>No run found</>
  } else {
    return (
      <>
        {run.activities.map((activity) =>
          isPiece(activity) ? (
            <Piece piece={activity} key={activity.start.time} />
          ) : (
            <Break break={activity} key={activity.startTime} />
          )
        )}
      </>
    )
  }
}

export const MinischeduleBlock = ({ activeTripId }: Props): ReactElement => {
  const block: Block | null | undefined = useMinischeduleBlock(activeTripId)
  if (block === undefined) {
    return <Loading />
  } else if (block === null) {
    return <>No block found</>
  } else {
    return (
      <>
        {block.pieces.map((piece) => (
          <Piece piece={piece} key={piece.start.time} />
        ))}
      </>
    )
  }
}

const Break = ({ break: breakk }: { break: Break }) => (
  <div className="m-minischedule__row">{JSON.stringify(breakk)}</div>
)

const Piece = ({ piece }: { piece: Piece }) => (
  <>
    {piece.trips.map((trip) => (
      <Trip trip={trip} key={trip.id} />
    ))}
  </>
)

const Trip = ({ trip }: { trip: Trip }) => (
  <div className="m-minischedule__row">{JSON.stringify(trip)}</div>
)

const isPiece = (activity: Piece | Break): activity is Piece =>
  activity.hasOwnProperty("trips")
