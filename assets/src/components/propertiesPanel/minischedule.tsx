import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import {
  busFrontIcon,
  busRearIcon,
  filledCircleIcon,
  minusIcon,
  plusIcon,
  questionMarkIcon,
  triangleDownIcon,
  triangleUpIcon,
} from "../../helpers/icon"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../hooks/useMinischedule"
import { Block, Break, Piece, Run, Trip } from "../../minischedule"
import {
  directionOnLadder,
  getLadderDirectionForRoute,
  LadderDirections,
  VehicleDirection,
} from "../../models/ladderDirection"
import { DirectionId, RouteId, TripId } from "../../schedule"
import { formattedDuration, formattedScheduledTime } from "../../util/dateTime"
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
            <Piece piece={activity} view="run" key={activity.start.time} />
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
          <Piece piece={piece} view="block" key={piece.start.time} />
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

const Break = ({ break: breakk }: { break: Break }) => {
  const formattedBreakTime = formattedDuration(
    breakk.endTime - breakk.startTime
  )
  return (
    <Row text={`Break (${breakk.breakType})`} rightText={formattedBreakTime} />
  )
}

const Piece = ({ piece, view }: { piece: Piece; view: "run" | "block" }) => (
  <>
    {view === "block" ? (
      <div className="m-minischedule__run-header">{piece.runId}</div>
    ) : null}
    <div className="m-minischedule__piece-rows">
      <Row
        key="sign-on"
        icon={plusIcon()}
        text={
          piece.trips.length === 0 || isDeadhead(piece.trips[0])
            ? "Start Time"
            : "Swing On"
        }
        rightText={formattedScheduledTime(piece.start.time)}
      />
      {piece.trips.map((trip, index) => {
        const sequence: "first" | "middle" | "last" =
          index === 0
            ? "first"
            : index === piece.trips.length - 1
            ? "last"
            : "middle"
        return <Trip trip={trip} sequence={sequence} key={trip.id} />
      })}
      <Row
        key="sign-off"
        icon={minusIcon()}
        text={
          piece.trips.length === 0 ||
          isDeadhead(piece.trips[piece.trips.length - 1])
            ? "Done"
            : "Swing Off"
        }
        rightText={formattedScheduledTime(piece.end.time)}
      />
    </div>
  </>
)

const Trip = ({
  trip,
  sequence,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
}) => {
  if (isDeadhead(trip)) {
    return <DeadheadTrip trip={trip} sequence={sequence} />
  } else {
    return <RevenueTrip trip={trip} />
  }
}

const DeadheadTrip = ({
  trip,
  sequence,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
}) => {
  const startTime: string = formattedScheduledTime(trip.startTime)
  if (sequence === "first") {
    return <Row icon={busFrontIcon()} text={"Pull Out"} rightText={startTime} />
  } else if (sequence === "last") {
    return <Row icon={busRearIcon()} text={"Pull Back"} rightText={startTime} />
  } else {
    return (
      <Row icon={filledCircleIcon()} text={"Deadhead"} rightText={startTime} />
    )
  }
}

const iconForDirectionOnLadder: (
  directionId: DirectionId,
  ladderDirections: LadderDirections,
  routeId: RouteId
) => ReactElement = (directionId, ladderDirections, routeId) => {
  const ladderDirection = getLadderDirectionForRoute(ladderDirections, routeId)
  if (
    directionOnLadder(directionId, ladderDirection) === VehicleDirection.Down
  ) {
    return triangleDownIcon()
  }
  return triangleUpIcon()
}

const RevenueTrip = ({ trip }: { trip: Trip }) => {
  const startTime: string = formattedScheduledTime(trip.startTime)
  const formattedVariant: string =
    trip.viaVariant !== null && trip.viaVariant !== "_" ? trip.viaVariant : ""
  const formattedRouteAndVariant: string = `${trip.routeId}_${formattedVariant}`
  const [{ ladderDirections }] = useContext(StateDispatchContext)

  const directionIcon =
    trip.directionId !== null
      ? // Safe to assume routeId is not null, since if it were, we'd be
        // rendering a deadhead row instead.
        iconForDirectionOnLadder(
          trip.directionId,
          ladderDirections,
          trip.routeId!
        )
      : questionMarkIcon()

  return (
    <Row
      icon={directionIcon}
      text={
        <>
          {formattedRouteAndVariant}{" "}
          <span className="m-minischedule__headsign">{trip.headsign}</span>
        </>
      }
      rightText={startTime}
    />
  )
}

const Row = ({
  icon,
  text,
  rightText,
}: {
  icon?: ReactElement
  text: string | ReactElement
  rightText?: string
}) => (
  <div className="m-minischedule__row">
    <div className="m-minischedule__icon">{icon}</div>
    <div className="m-minischedule__left-text">{text}</div>
    {rightText && <div className="m-minischedule__right-text">{rightText}</div>}
  </div>
)

const isPiece = (activity: Piece | Break): activity is Piece =>
  activity.hasOwnProperty("trips")

const isDeadhead = (trip: Trip): boolean => trip.routeId == null
