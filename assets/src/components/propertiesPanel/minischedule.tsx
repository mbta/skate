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
        <Header label="Run" value={run.id} />
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
        <Header label="Block" value={block.id} />
        {block.pieces.map((piece) => (
          <React.Fragment key={piece.start.time}>
            <div className="m-minischedule__run-header">{piece.runId}</div>
            <Piece piece={piece} />
          </React.Fragment>
        ))}
      </>
    )
  }
}

const Header = ({ label, value }: { label: string; value: string }) => (
  <div className="m-minischedule__header">
    <span className="m-minischedule__header-label">{label}</span>
    {value}
  </div>
)

const Break = ({ break: breakk }: { break: Break }) => (
  <Row text={JSON.stringify(breakk)} />
)

const Piece = ({ piece }: { piece: Piece }) => (
  <>
    <Row key="sign-on" text={JSON.stringify(piece.start)} />
    {piece.trips.map((trip) => (
      <Trip trip={trip} key={trip.id} />
    ))}
    <Row key="sign-off" text={JSON.stringify(piece.end)} />
  </>
)

const Trip = ({ trip }: { trip: Trip }) => <Row text={JSON.stringify(trip)} />

const Row = ({ text }: { text: string }) => (
  <div className="m-minischedule__row">{text}</div>
)

const isPiece = (activity: Piece | Break): activity is Piece =>
  activity.hasOwnProperty("trips")
