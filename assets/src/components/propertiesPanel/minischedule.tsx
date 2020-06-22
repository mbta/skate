import React, {
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useState,
} from "react"
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
  upDownIcon,
} from "../../helpers/icon"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../hooks/useMinischedule"
import {
  AsDirected,
  Block,
  Break,
  Piece,
  Run,
  Time,
  Trip,
} from "../../minischedule"
import {
  directionOnLadder,
  getLadderDirectionForRoute,
  LadderDirections,
  VehicleDirection,
} from "../../models/ladderDirection"
import { drawnStatus, DrawnStatus } from "../../models/vehicleStatus"
import { VehicleOrGhost } from "../../realtime"
import { DirectionId, RouteId, TripId } from "../../schedule"
import { formattedDuration, formattedScheduledTime } from "../../util/dateTime"
import Loading from "../loading"

export interface Props {
  vehicleOrGhost: VehicleOrGhost
}

export const MinischeduleRun = ({ vehicleOrGhost }: Props): ReactElement => {
  const run: Run | null | undefined = useMinischeduleRun(vehicleOrGhost.tripId!)
  return (
    <Minischedule runOrBlock={run} vehicleOrGhost={vehicleOrGhost} view="run" />
  )
}

export const MinischeduleBlock = ({ vehicleOrGhost }: Props): ReactElement => {
  const block: Block | null | undefined = useMinischeduleBlock(
    vehicleOrGhost.tripId!
  )
  return (
    <Minischedule
      runOrBlock={block}
      vehicleOrGhost={vehicleOrGhost}
      view="block"
    />
  )
}

export const Minischedule = ({
  runOrBlock,
  vehicleOrGhost,
  view,
}: {
  runOrBlock: Run | Block | null | undefined
  vehicleOrGhost: VehicleOrGhost
  view: "run" | "block"
}) => {
  const [showPast, setShowPast] = useState<boolean>(false)
  if (runOrBlock === undefined) {
    return <Loading />
  } else if (runOrBlock === null) {
    return view === "run" ? <>No run found</> : <>No block found</>
  } else {
    const activities: (Piece | Break)[] =
      (runOrBlock as Run).activities || (runOrBlock as Block).pieces
    const activeIndex = getActiveIndex(activities, vehicleOrGhost.tripId)
    return (
      <div
        className={className([
          "m-minischedule",
          `m-minischedule--${showPast ? "show-past" : "hide-past"}`,
        ])}
      >
        <PastToggle showPast={showPast} setShowPast={setShowPast} />
        <Header
          label={view === "run" ? "Run" : "Block"}
          value={runOrBlock.id}
        />
        {view === "run" ? <DutyDetails run={runOrBlock as Run} /> : null}
        {activities.map((activity, index) =>
          isPiece(activity) ? (
            <Piece
              piece={activity}
              view={view}
              vehicleOrGhost={vehicleOrGhost}
              pieceIndex={index}
              activeIndex={activeIndex}
              key={activity.startTime}
            />
          ) : (
            <BreakRow
              key={activity.startTime}
              break={activity}
              index={index}
              activeIndex={activeIndex}
            />
          )
        )}
      </div>
    )
  }
}

const PastToggle = ({
  showPast,
  setShowPast,
}: {
  showPast: boolean
  setShowPast: Dispatch<SetStateAction<boolean>>
}) => (
  <button
    className="m-minischedule__show-past"
    onClick={() => setShowPast(!showPast)}
  >
    {upDownIcon("m-minischedule__show-past-icon")}
    {`${showPast ? "Hide" : "Show"} past trips`}
  </button>
)

const Header = ({ label, value }: { label: string; value: string }) => (
  <div className="m-minischedule__header">
    <span className="m-minischedule__header-label">{label}</span>
    {value}
  </div>
)

const DutyDetails = ({ run }: { run: Run }) => {
  const paidBreakTotal = paidBreakTotalDuration(run)
  const workingHours = workingHoursDuration(run)
  const totalHours = totalHoursDuration(run)
  const formattedPaidBreakTotal = formattedDuration(paidBreakTotal)
  const formattedWorkingHours = formattedDuration(workingHours)
  const formattedTotalHours = formattedDuration(totalHours)

  return (
    <div className="m-minischedule__duty-details">
      <span className="m-minischedule__header-label">Paid break</span>
      <span className="m-minischedule__duty-details-data">
        {formattedPaidBreakTotal}
      </span>
      <br />
      <span className="m-minischedule__header-label">Working hours</span>
      <span className="m-minischedule__duty-details-data">
        {formattedWorkingHours}
      </span>
      <br />
      <span className="m-minischedule__header-label">Total hours</span>
      <span className="m-minischedule__duty-details-data">
        {formattedTotalHours}
      </span>
    </div>
  )
}

const paidBreakTotalDuration = (run: Run): number => {
  const paidBreaks: Break[] = run.activities.filter(
    (activity) => isBreak(activity) && breakIsPaid(activity.breakType)
  ) as Break[]
  return paidBreaks.reduce(
    (total, breakk) => total + breakk.endTime - breakk.startTime,
    0
  )
}

const workingHoursDuration = (run: Run): number => {
  const pieces: Piece[] = run.activities.filter((activity) =>
    isPiece(activity)
  ) as Piece[]

  return pieces.reduce(
    (total, piece) => total + piece.endTime - piece.startTime,
    0
  )
}

const runHasPartTimeOperator = (run: Run): boolean =>
  // Runs driven by part-timers have a run number starting with "9"
  !!run.id.match(/^\d{3}-9\d{3}$/)

const totalHoursDuration = (run: Run): number => {
  const firstActivity = run.activities[0]
  const lastActivity = run.activities[run.activities.length - 1]
  const realDuration = lastActivity.endTime - firstActivity.startTime

  // Part-timers have their 10-minute report time counted in total hours.
  // Full-timers do not.
  return runHasPartTimeOperator(run) ? realDuration : realDuration - 600
}

export const BreakRow = ({
  break: breakk,
  index,
  activeIndex,
}: {
  break: Break
  index: number
  activeIndex: [number, number] | null
}) => {
  const formattedBreakTime = formattedDuration(
    breakk.endTime - breakk.startTime
  )
  const isPaid: boolean | null = breakIsPaid(breakk.breakType)
  const isPaidText: string =
    isPaid === null ? "" : isPaid ? " (Paid)" : " (Unpaid)"
  const text: string = breakDisplayText(breakk) + isPaidText

  const timeBasedStyle: TimeBasedStyle = getTimeBasedStyle(
    index,
    activeIndex && activeIndex[0]
  )

  if (breakk.breakType === "Travel from" || breakk.breakType === "Travel to") {
    return (
      <Row
        text={text}
        rightText={formattedBreakTime}
        timeBasedStyle={timeBasedStyle}
      />
    )
  } else {
    return (
      <Row
        text={text}
        rightText={formattedBreakTime}
        belowText={breakk.endPlace}
        timeBasedStyle={timeBasedStyle}
      />
    )
  }
}

const Layover = ({
  nextTrip,
  previousEndTime,
  timeBasedStyle,
  activeStatus,
}: {
  nextTrip: Trip | AsDirected
  previousEndTime: Time | undefined
  timeBasedStyle: TimeBasedStyle
  activeStatus: DrawnStatus | null
}) => {
  if (!previousEndTime) {
    return null
  }
  const layoverDuration = nextTrip.startTime - previousEndTime
  if (layoverDuration === 0) {
    return null
  }

  return (
    <Row
      text="Layover"
      rightText={formattedDuration(layoverDuration)}
      timeBasedStyle={timeBasedStyle}
      activeStatus={activeStatus}
      extraClasses={["m-minischedule__layover-row"]}
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
  const pieceTimeBasedStyle: TimeBasedStyle = getTimeBasedStyle(
    pieceIndex,
    activeIndex && activeIndex[0]
  )
  const startTimeBasedStyle: TimeBasedStyle =
    pieceTimeBasedStyle === "current" ? "past" : pieceTimeBasedStyle
  const doneTimeBasedStyle: TimeBasedStyle =
    pieceTimeBasedStyle === "current" ? "future" : pieceTimeBasedStyle

  return (
    <div className={`m-minischedule__piece--${pieceTimeBasedStyle}`}>
      {view === "block" ? (
        <div className="m-minischedule__run-header">{piece.runId}</div>
      ) : null}
      {view === "run" && piece.startMidRoute ? (
        <MidRouteSwingOnFirstHalf trip={piece.startMidRoute.trip} />
      ) : null}
      {isSwingOn ? null : (
        <Row
          text="Start time"
          rightText={formattedScheduledTime(piece.startTime)}
          belowText={piece.startPlace}
          timeBasedStyle={startTimeBasedStyle}
        />
      )}
      <div className="m-minischedule__piece-rows">
        {isSwingOn ? (
          <Row
            key="swing-on"
            icon={plusIcon()}
            text={piece.startMidRoute ? "Swing on mid-route" : "Swing on"}
            rightText={formattedScheduledTime(piece.startTime)}
            belowText={piece.startPlace}
            timeBasedStyle={startTimeBasedStyle}
          />
        ) : null}
        {piece.startMidRoute ? (
          <MidRouteSwingOnSecondHalf
            key="mid-route-swing-on"
            time={piece.startMidRoute.time}
            trip={piece.startMidRoute.trip}
          />
        ) : null}
        {piece.trips.map((trip, tripIndex) => {
          const tripTimeBasedStyle =
            pieceTimeBasedStyle === "current"
              ? getTimeBasedStyle(tripIndex, activeIndex && activeIndex[1])
              : pieceTimeBasedStyle
          return (
            <Trip
              trip={trip}
              previousEndTime={
                piece.trips[tripIndex - 1]?.endTime ||
                piece.startMidRoute?.trip.endTime
              }
              sequence={getSequence(tripIndex, piece.trips)}
              tripTimeBasedStyle={tripTimeBasedStyle}
              vehicleOrGhost={vehicleOrGhost}
              view={view}
              key={trip.startTime}
            />
          )
        })}
        {isSwingOff ? (
          <Row
            key="swing-off"
            icon={minusIcon()}
            text={piece.endMidRoute ? "Swing off mid-route" : "Swing off"}
            rightText={formattedScheduledTime(piece.endTime)}
            belowText={piece.endPlace}
            timeBasedStyle={doneTimeBasedStyle}
          />
        ) : null}
      </div>
      {isSwingOff ? null : (
        <Row
          text="Done"
          rightText={formattedScheduledTime(piece.endTime)}
          belowText={piece.endPlace}
          timeBasedStyle={doneTimeBasedStyle}
        />
      )}
    </div>
  )
}

const MidRouteSwingOnFirstHalf = ({ trip }: { trip: Trip }) => (
  <RevenueTrip
    trip={trip}
    timeBasedStyle={"unknown"}
    activeStatus={null}
    belowText={`Run ${trip.runId}`}
    extraClasses={["m-minischedule__row--mid-route-first-half"]}
  />
)

const MidRouteSwingOnSecondHalf = ({
  time,
  trip,
}: {
  time: Time
  trip: Trip
}) => (
  <RevenueTrip
    trip={{ ...trip, startTime: time }}
    timeBasedStyle={"unknown"}
    activeStatus={null}
  />
)

const getSequence = (tripIndex: number, pieceTrips: (Trip | AsDirected)[]) => {
  if (tripIndex === 0) {
    return "first"
  } else if (tripIndex === pieceTrips.length - 1) {
    return "last"
  } else {
    return "middle"
  }
}

const Trip = ({
  trip,
  previousEndTime,
  sequence,
  tripTimeBasedStyle,
  vehicleOrGhost,
  view,
}: {
  trip: Trip | AsDirected
  previousEndTime: Time | undefined
  sequence: "first" | "middle" | "last"
  tripTimeBasedStyle: TimeBasedStyle
  vehicleOrGhost: VehicleOrGhost
  view: "run" | "block"
}) => {
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
  const layoverActiveStatus: DrawnStatus | null =
    layoverTimeBasedStyle === "current" ? drawnStatus(vehicleOrGhost) : null
  const onRouteActiveStatus: DrawnStatus | null =
    onRouteTimeBasedStyle === "current" ? drawnStatus(vehicleOrGhost) : null

  return (
    <>
      {view === "run" ? (
        <Layover
          nextTrip={trip}
          previousEndTime={previousEndTime}
          timeBasedStyle={layoverTimeBasedStyle}
          activeStatus={layoverActiveStatus}
        />
      ) : null}
      {isTrip(trip) ? (
        isDeadhead(trip) ? (
          <DeadheadTrip
            trip={trip}
            sequence={sequence}
            timeBasedStyle={onRouteTimeBasedStyle}
          />
        ) : (
          <RevenueTrip
            trip={trip}
            timeBasedStyle={onRouteTimeBasedStyle}
            activeStatus={onRouteActiveStatus}
          />
        )
      ) : (
        <AsDirected asDirected={trip} timeBasedStyle={onRouteTimeBasedStyle} />
      )}
    </>
  )
}

const DeadheadTrip = ({
  trip,
  sequence,
  timeBasedStyle,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
  timeBasedStyle: TimeBasedStyle
}) => {
  const startTime: string = formattedScheduledTime(trip.startTime)
  if (sequence === "first") {
    return (
      <Row
        icon={busFrontIcon()}
        text={"Pull out"}
        rightText={startTime}
        belowText={trip.startPlace}
        timeBasedStyle={timeBasedStyle}
      />
    )
  } else if (sequence === "last") {
    return (
      <Row
        icon={busRearIcon()}
        text={"Pull back"}
        rightText={startTime}
        belowText={trip.endPlace}
        timeBasedStyle={timeBasedStyle}
      />
    )
  } else {
    return (
      <Row
        icon={filledCircleIcon()}
        text={"Deadhead"}
        rightText={startTime}
        belowText={trip.endPlace}
        timeBasedStyle={timeBasedStyle}
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
  timeBasedStyle,
  activeStatus,
  belowText,
  extraClasses,
}: {
  trip: Trip
  timeBasedStyle: TimeBasedStyle
  activeStatus: DrawnStatus | null
  belowText?: string
  extraClasses?: string[]
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
      belowText={belowText}
      timeBasedStyle={timeBasedStyle}
      activeStatus={activeStatus}
      extraClasses={extraClasses}
    />
  )
}

const AsDirected = ({
  asDirected,
  timeBasedStyle,
}: {
  asDirected: AsDirected
  timeBasedStyle: TimeBasedStyle
}) => (
  <Row
    icon={busFrontIcon()}
    text={asDirected.kind === "rad" ? "Run as directed" : "Work as directed"}
    rightText={formattedScheduledTime(asDirected.startTime)}
    timeBasedStyle={timeBasedStyle}
  />
)

const Row = ({
  icon,
  text,
  rightText,
  belowText,
  timeBasedStyle,
  activeStatus,
  extraClasses,
}: {
  icon?: ReactElement
  text: string
  rightText?: string
  belowText?: string
  timeBasedStyle?: TimeBasedStyle
  activeStatus?: DrawnStatus | null
  extraClasses?: string[]
}) => (
  <div
    className={className([
      "m-minischedule__row",
      timeBasedStyle && "m-minischedule__row--" + timeBasedStyle,
      activeStatus,
      ...(extraClasses || []),
    ])}
  >
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

const isBreak = (activity: Piece | Break): activity is Break =>
  activity.hasOwnProperty("breakType")

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
