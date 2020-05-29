import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { className } from "../../helpers/dom"
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
import { AsDirected, Block, Break, Piece, Run, Trip } from "../../minischedule"
import {
  directionOnLadder,
  getLadderDirectionForRoute,
  LadderDirections,
  VehicleDirection,
} from "../../models/ladderDirection"
import { drawnStatus } from "../../models/vehicleStatus"
import { VehicleOrGhost } from "../../realtime"
import { DirectionId, RouteId, TripId } from "../../schedule"
import { formattedDuration, formattedScheduledTime } from "../../util/dateTime"
import Loading from "../loading"

export interface Props {
  vehicleOrGhost: VehicleOrGhost
}

export const MinischeduleRun = ({ vehicleOrGhost }: Props): ReactElement => {
  const run: Run | null | undefined = useMinischeduleRun(vehicleOrGhost.tripId!)

  if (run === undefined) {
    return <Loading />
  } else if (run === null) {
    return <>No run found</>
  } else {
    const activeIndex = getActiveIndex(run.activities, vehicleOrGhost.tripId)
    return (
      <>
        <Header label="Run" value={run.id} />
        {run.activities.map((activity, index) =>
          isPiece(activity) ? (
            <Piece
              piece={activity}
              view="run"
              vehicleOrGhost={vehicleOrGhost}
              pieceIndex={index}
              activeIndex={activeIndex}
              key={activity.start.time}
            />
          ) : (
            <BreakRow break={activity} key={activity.startTime} />
          )
        )}
      </>
    )
  }
}

export const MinischeduleBlock = ({ vehicleOrGhost }: Props): ReactElement => {
  const block: Block | null | undefined = useMinischeduleBlock(
    vehicleOrGhost.tripId!
  )

  if (block === undefined) {
    return <Loading />
  } else if (block === null) {
    return <>No block found</>
  } else {
    const activeIndex = getActiveIndex(block.pieces, vehicleOrGhost.tripId)
    return (
      <>
        <Header label="Block" value={block.id} />
        {block.pieces.map((piece, index) => (
          <Piece
            piece={piece}
            view={"block"}
            vehicleOrGhost={vehicleOrGhost}
            pieceIndex={index}
            activeIndex={activeIndex}
            key={piece.start.time}
          />
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

export const BreakRow = ({ break: breakk }: { break: Break }) => {
  const formattedBreakTime = formattedDuration(
    breakk.endTime - breakk.startTime
  )
  const isPaid: boolean | null = breakIsPaid(breakk.breakType)
  const isPaidText: string =
    isPaid === null ? "" : isPaid ? " (Paid)" : " (Unpaid)"
  const text: string = breakDisplayText(breakk) + isPaidText

  if (breakk.breakType === "Travel from" || breakk.breakType === "Travel to") {
    return <Row text={text} rightText={formattedBreakTime} />
  } else {
    return (
      <Row
        text={text}
        rightText={formattedBreakTime}
        belowText={breakk.endPlace}
      />
    )
  }
}

const Layover = ({
  nextTrip,
  previousTrip,
  extraClasses,
}: {
  nextTrip: Trip | AsDirected
  previousTrip?: Trip | AsDirected
  extraClasses: (string | null)[]
}) => {
  if (!previousTrip) {
    return null
  }
  const layoverDuration = nextTrip.startTime - previousTrip.endTime
  if (layoverDuration === 0) {
    return null
  }

  return (
    <Row
      text="Layover"
      rightText={formattedDuration(layoverDuration)}
      extraClasses={["m-minischedule__layover-row", ...extraClasses]}
    />
  )
}

const Piece = ({
  piece,
  view,
  vehicleOrGhost,
  pieceIndex,
  activeIndex,
}: {
  piece: Piece
  view: "run" | "block"
  vehicleOrGhost: VehicleOrGhost
  pieceIndex: number
  activeIndex: [number, number] | null
}) => {
  const isSwingOn: boolean =
    piece.trips.length > 0 &&
    isTrip(piece.trips[0]) &&
    !isDeadhead(piece.trips[0])
  const isSwingOff: boolean =
    piece.trips.length > 0 &&
    isTrip(piece.trips[piece.trips.length - 1]) &&
    !isDeadhead(piece.trips[piece.trips.length - 1])
  const startPlace: string =
    piece.trips.length > 0 && isTrip(piece.trips[0])
      ? piece.trips[0].startPlace
      : ""
  const endPlace: string =
    piece.trips[piece.trips.length - 1] &&
    isTrip(piece.trips[piece.trips.length - 1])
      ? (piece.trips[piece.trips.length - 1] as Trip).endPlace
      : ""
  const pieceTimeBasedStyle: TimeBasedStyle = getTimeBasedStyle(
    pieceIndex,
    activeIndex && activeIndex[0]
  )

  return (
    <>
      {view === "block" ? (
        <div className="m-minischedule__run-header">{piece.runId}</div>
      ) : null}
      {isSwingOn ? null : (
        <Row
          text="Start time"
          rightText={formattedScheduledTime(piece.start.time)}
          belowText={startPlace}
        />
      )}
      <div
        className={className([
          "m-minischedule__piece-rows",
          `m-minischedule__piece-rows--${pieceTimeBasedStyle}`,
        ])}
      >
        {isSwingOn ? (
          <Row
            key="swing-on"
            icon={plusIcon()}
            text="Swing on"
            rightText={formattedScheduledTime(piece.start.time)}
            belowText={startPlace}
          />
        ) : null}
        {piece.trips.map((trip, tripIndex) => {
          const sequence: "first" | "middle" | "last" =
            tripIndex === 0
              ? "first"
              : tripIndex === piece.trips.length - 1
              ? "last"
              : "middle"
          const tripTimeBasedStyle =
            pieceTimeBasedStyle === "current"
              ? getTimeBasedStyle(tripIndex, activeIndex && activeIndex[1])
              : pieceTimeBasedStyle
          const layoverTimeBasedStyle =
            tripTimeBasedStyle === "current"
              ? vehicleOrGhost.routeStatus === "on_route"
                ? "past"
                : "current"
              : tripTimeBasedStyle
          const onRouteTimeBasedStyle =
            tripTimeBasedStyle === "current"
              ? vehicleOrGhost.routeStatus === "on_route"
                ? "current"
                : "future"
              : tripTimeBasedStyle

          return (
            <React.Fragment key={trip.startTime}>
              {view === "run" ? (
                <Layover
                  nextTrip={trip}
                  previousTrip={piece.trips[tripIndex - 1]}
                  extraClasses={[
                    `m-minischedule__row--${layoverTimeBasedStyle}`,
                    layoverTimeBasedStyle === "current"
                      ? drawnStatus(vehicleOrGhost)
                      : null,
                  ]}
                />
              ) : null}
              {isTrip(trip) ? (
                <Trip
                  trip={trip}
                  sequence={sequence}
                  extraClasses={[
                    `m-minischedule__row--${onRouteTimeBasedStyle}`,
                    onRouteTimeBasedStyle === "current"
                      ? drawnStatus(vehicleOrGhost)
                      : null,
                  ]}
                />
              ) : (
                <AsDirected
                  asDirected={trip}
                  extraClasses={[
                    `m-minischedule__row--${onRouteTimeBasedStyle}`,
                  ]}
                />
              )}
            </React.Fragment>
          )
        })}
        {isSwingOff ? (
          <Row
            key="swing-off"
            icon={minusIcon()}
            text="Swing off"
            rightText={formattedScheduledTime(piece.end.time)}
            belowText={startPlace}
          />
        ) : null}
      </div>
      {isSwingOff ? null : (
        <Row
          text="Done"
          rightText={formattedScheduledTime(piece.end.time)}
          belowText={endPlace}
        />
      )}
    </>
  )
}

const Trip = ({
  trip,
  sequence,
  extraClasses,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
  extraClasses: (string | null)[]
}) => {
  if (isDeadhead(trip)) {
    return (
      <DeadheadTrip
        trip={trip}
        sequence={sequence}
        extraClasses={extraClasses}
      />
    )
  } else {
    return <RevenueTrip trip={trip} extraClasses={extraClasses} />
  }
}

const DeadheadTrip = ({
  trip,
  sequence,
  extraClasses,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
  extraClasses: (string | null)[]
}) => {
  const startTime: string = formattedScheduledTime(trip.startTime)
  if (sequence === "first") {
    return (
      <Row
        icon={busFrontIcon()}
        text={"Pull out"}
        rightText={startTime}
        belowText={trip.startPlace}
        extraClasses={extraClasses}
      />
    )
  } else if (sequence === "last") {
    return (
      <Row
        icon={busRearIcon()}
        text={"Pull back"}
        rightText={startTime}
        belowText={trip.endPlace}
        extraClasses={extraClasses}
      />
    )
  } else {
    return (
      <Row
        icon={filledCircleIcon()}
        text={"Deadhead"}
        rightText={startTime}
        belowText={trip.endPlace}
        extraClasses={extraClasses}
      />
    )
  }
}

const iconForDirectionOnLadder: (
  directionId: DirectionId | null,
  ladderDirections: LadderDirections,
  routeId: RouteId
) => ReactElement = (directionId, ladderDirections, routeId) => {
  if (directionId === null) {
    return questionMarkIcon()
  }

  const ladderDirection = getLadderDirectionForRoute(ladderDirections, routeId)
  if (
    directionOnLadder(directionId, ladderDirection) === VehicleDirection.Down
  ) {
    return triangleDownIcon()
  }
  return triangleUpIcon()
}

const RevenueTrip = ({
  trip,
  extraClasses,
}: {
  trip: Trip
  extraClasses: (string | null)[]
}) => {
  const startTime: string = formattedScheduledTime(trip.startTime)
  const formattedRouteAndHeadsign: string = [
    trip.routeId,
    "_",
    trip.viaVariant !== null && trip.viaVariant !== "_" ? trip.viaVariant : "",
    " ",
    trip.headsign || "",
  ].join("")
  const [{ ladderDirections }] = useContext(StateDispatchContext)

  const directionIcon =
    // Safe to assume routeId is not null, since if it were, we'd be
    // rendering a deadhead row instead.
    iconForDirectionOnLadder(trip.directionId, ladderDirections, trip.routeId!)

  return (
    <Row
      icon={directionIcon}
      text={formattedRouteAndHeadsign}
      rightText={startTime}
      extraClasses={extraClasses}
    />
  )
}

const AsDirected = ({
  asDirected,
  extraClasses,
}: {
  asDirected: AsDirected
  extraClasses: string[]
}) => (
  <Row
    icon={busFrontIcon()}
    text={asDirected.kind === "rad" ? "Run as directed" : "Work as directed"}
    rightText={formattedScheduledTime(asDirected.startTime)}
    extraClasses={extraClasses}
  />
)

const Row = ({
  icon,
  text,
  rightText,
  belowText,
  extraClasses,
}: {
  icon?: ReactElement
  text: string
  rightText?: string
  belowText?: string
  extraClasses?: (string | null)[]
}) => (
  <div className={className(["m-minischedule__row", ...(extraClasses || [])])}>
    <div className="m-minischedule__icon">{icon}</div>
    <div className="m-minischedule__left-text">
      {text}
      {belowText && (
        <>
          <br />
          <span className="m-minischedule__below-text">{belowText}</span>
        </>
      )}
    </div>
    {rightText && <div className="m-minischedule__right-text">{rightText}</div>}
  </div>
)

/** returns null if the active trip isn't found.
 * returns [activeActivityIndex, activeTripIndex] if it is
 */
const getActiveIndex = (
  activities: (Piece | Break)[],
  activeTripId: TripId | null
): [number, number] | null => {
  if (activeTripId === null) {
    return null
  }
  for (
    let activityIndex = 0;
    activityIndex < activities.length;
    activityIndex++
  ) {
    const activity = activities[activityIndex]
    if (isPiece(activity)) {
      for (let tripIndex = 0; tripIndex < activity.trips.length; tripIndex++) {
        const trip = activity.trips[tripIndex]
        if (isTrip(trip) && trip.id === activeTripId) {
          return [activityIndex, tripIndex]
        }
      }
    }
  }
  return null
}

type TimeBasedStyle = "past" | "current" | "future" | "unknown"

const getTimeBasedStyle = (
  componentIndex: number,
  activeIndex: number | null
): TimeBasedStyle => {
  if (activeIndex === null) {
    return "unknown"
  }
  if (componentIndex < activeIndex) {
    return "past"
  }
  if (componentIndex > activeIndex) {
    return "future"
  }
  return "current"
}

const isPiece = (activity: Piece | Break): activity is Piece =>
  activity.hasOwnProperty("trips")

const isTrip = (trip: Trip | AsDirected): trip is Trip =>
  trip.hasOwnProperty("id")

const isDeadhead = (trip: Trip | AsDirected): boolean =>
  isTrip(trip) && trip.routeId == null

const breakDisplayText = (breakk: Break): string => {
  switch (breakk.breakType) {
    case "Split break":
    case "Paid meal after":
    case "Paid meal before":
      return "Break"
    case "Travel from":
    case "Travel to":
      return `Travel to ${breakk.endPlace}`
    default:
      return breakk.breakType
  }
}

/** null means unrecognized break type, and we're not sure if it's paid
 */
const breakIsPaid = (breakType: string): boolean | null => {
  switch (breakType) {
    case "Split break":
      return false
    case "Paid meal after":
    case "Paid meal before":
    case "Travel from":
    case "Travel to":
    case "Joinup":
    case "Technical break":
      return true
    default:
      return null
  }
}
