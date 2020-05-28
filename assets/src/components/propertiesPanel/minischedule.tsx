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
import { RouteStatus, VehicleOrGhost } from "../../realtime"
import { DirectionId, RouteId } from "../../schedule"
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
    return (
      <>
        <Header label="Run" value={run.id} />
        {run.activities.map((activity) =>
          isPiece(activity) ? (
            <Piece
              piece={activity}
              view="run"
              vehicleOrGhost={vehicleOrGhost}
              key={activity.start.time}
            />
          ) : (
            <Break break={activity} key={activity.startTime} />
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
    return (
      <>
        <Header label="Block" value={block.id} />
        {block.pieces.map((piece) => (
          <Piece
            piece={piece}
            view={"block"}
            vehicleOrGhost={vehicleOrGhost}
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

const Break = ({ break: breakk }: { break: Break }) => {
  const formattedBreakTime = formattedDuration(
    breakk.endTime - breakk.startTime
  )
  return (
    <Row text={`Break (${breakk.breakType})`} rightText={formattedBreakTime} />
  )
}

const Layover = ({
  currentTrip,
  nextTrip,
  vehicleOrGhost,
}: {
  currentTrip: Trip | AsDirected
  nextTrip?: Trip | AsDirected
  vehicleOrGhost: VehicleOrGhost
}) => {
  if (!nextTrip) {
    return null
  }
  const layoverDuration = nextTrip.startTime - currentTrip.endTime
  if (layoverDuration === 0) {
    return null
  }

  const extraClasses = currentClasses(nextTrip, vehicleOrGhost, "laying_over")

  return (
    <Row
      text="Layover"
      rightText={formattedDuration(layoverDuration)}
      extraClasses={["m-minischedule__layover-row", ...extraClasses]}
    />
  )
}

const currentClasses: (
  nextTrip: Trip | AsDirected,
  vehicleOrGhost: VehicleOrGhost,
  requiredStatus: RouteStatus
) => string[] = (nextTrip, vehicleOrGhost, requiredStatus) => {
  if (isAsDirected(nextTrip)) {
    return []
  }

  if (vehicleOrGhost.routeStatus !== requiredStatus) {
    return []
  }

  if (nextTrip.id !== vehicleOrGhost.tripId) {
    return []
  }

  return ["m-minischedule__row--current", drawnStatus(vehicleOrGhost)]
}

const Piece = ({
  piece,
  view,
  vehicleOrGhost,
}: {
  piece: Piece
  view: "run" | "block"
  vehicleOrGhost: VehicleOrGhost
}) => {
  const isSwingOn: boolean =
    piece.trips.length > 0 &&
    isTrip(piece.trips[0]) &&
    !isDeadhead(piece.trips[0])
  const isSwingOff: boolean =
    piece.trips.length > 0 &&
    isTrip(piece.trips[piece.trips.length - 1]) &&
    !isDeadhead(piece.trips[piece.trips.length - 1])
  return (
    <>
      {view === "block" ? (
        <div className="m-minischedule__run-header">{piece.runId}</div>
      ) : null}
      {isSwingOn ? null : (
        <Row
          text="Start time"
          rightText={formattedScheduledTime(piece.start.time)}
        />
      )}
      <div className="m-minischedule__piece-rows">
        {isSwingOn ? (
          <Row
            key="swing-on"
            icon={plusIcon()}
            text="Swing on"
            rightText={formattedScheduledTime(piece.start.time)}
          />
        ) : null}
        {piece.trips.map((trip, index) => {
          const sequence: "first" | "middle" | "last" =
            index === 0
              ? "first"
              : index === piece.trips.length - 1
              ? "last"
              : "middle"
          return (
            <React.Fragment key={trip.startTime}>
              {isTrip(trip) ? (
                <Trip
                  trip={trip}
                  sequence={sequence}
                  vehicleOrGhost={vehicleOrGhost}
                />
              ) : (
                <AsDirected asDirected={trip} />
              )}
              {view === "run" ? (
                <Layover
                  currentTrip={trip}
                  nextTrip={piece.trips[index + 1]}
                  vehicleOrGhost={vehicleOrGhost}
                />
              ) : null}
            </React.Fragment>
          )
        })}
        {isSwingOff ? (
          <Row
            key="swing-off"
            icon={minusIcon()}
            text="Swing off"
            rightText={formattedScheduledTime(piece.end.time)}
          />
        ) : null}
      </div>
      {isSwingOff ? null : (
        <Row text="Done" rightText={formattedScheduledTime(piece.end.time)} />
      )}
    </>
  )
}

const Trip = ({
  trip,
  sequence,
  vehicleOrGhost,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
  vehicleOrGhost: VehicleOrGhost
}) => {
  if (isDeadhead(trip)) {
    return (
      <DeadheadTrip
        trip={trip}
        sequence={sequence}
        vehicleOrGhost={vehicleOrGhost}
      />
    )
  } else {
    return <RevenueTrip trip={trip} vehicleOrGhost={vehicleOrGhost} />
  }
}

const DeadheadTrip = ({
  trip,
  sequence,
  vehicleOrGhost,
}: {
  trip: Trip
  sequence: "first" | "middle" | "last"
  vehicleOrGhost: VehicleOrGhost
}) => {
  const extraClasses = currentClasses(trip, vehicleOrGhost, "on_route")
  const startTime: string = formattedScheduledTime(trip.startTime)
  if (sequence === "first") {
    return (
      <Row
        icon={busFrontIcon()}
        text={"Pull out"}
        rightText={startTime}
        extraClasses={extraClasses}
      />
    )
  } else if (sequence === "last") {
    return (
      <Row
        icon={busRearIcon()}
        text={"Pull back"}
        rightText={startTime}
        extraClasses={extraClasses}
      />
    )
  } else {
    return (
      <Row
        icon={filledCircleIcon()}
        text={"Deadhead"}
        rightText={startTime}
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
  vehicleOrGhost,
}: {
  trip: Trip
  vehicleOrGhost: VehicleOrGhost
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
      extraClasses={currentClasses(trip, vehicleOrGhost, "on_route")}
    />
  )
}

const AsDirected = ({ asDirected }: { asDirected: AsDirected }) => (
  <Row
    icon={busFrontIcon()}
    text={asDirected.kind === "rad" ? "Run as directed" : "Work as directed"}
    rightText={formattedScheduledTime(asDirected.startTime)}
  />
)

const Row = ({
  icon,
  text,
  rightText,
  extraClasses,
}: {
  icon?: ReactElement
  text: string
  rightText?: string
  extraClasses?: string[]
}) => (
  <div className={className(["m-minischedule__row", ...(extraClasses || [])])}>
    <div className="m-minischedule__icon">{icon}</div>
    <div className="m-minischedule__left-text">{text}</div>
    {rightText && <div className="m-minischedule__right-text">{rightText}</div>}
  </div>
)

const isPiece = (activity: Piece | Break): activity is Piece =>
  activity.hasOwnProperty("trips")

const isTrip = (trip: Trip | AsDirected): trip is Trip =>
  trip.hasOwnProperty("id")

const isAsDirected = (trip: Trip | AsDirected): trip is AsDirected =>
  !isTrip(trip)

const isDeadhead = (trip: Trip | AsDirected): boolean =>
  isTrip(trip) && trip.routeId == null
