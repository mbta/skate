import React from "react"
import Loading from "../loading"
import { useMinischeduleRuns } from "../../hooks/useMinischedule"
import { Activity, Run, Piece, Trip } from "../../minischedule"
import { BlockWaiverNotification, Notification, RunId } from "../../realtime"
import { now, serviceDaySeconds } from "../../util/dateTime"
import { notificationTitle } from "../notificationCards/blockWaiverNotificationCard"
import BasicNotificationModal from "./basicNotificationModal"

type RunScheduleRelationship = "current" | "break" | "past"

const InactiveNotificationModal = ({
  notification,
}: {
  notification: Notification<BlockWaiverNotification>
}) => {
  const runs: (Run | null)[] | undefined = useMinischeduleRuns(
    notification.content.tripIds
  )

  if (runs !== undefined) {
    const uniqueRuns = Object.values(
      (runs.filter((run) => run !== null) as Run[]).reduce(
        (acc: Record<RunId, Run>, run: Run) => {
          acc[run.id] = run
          return acc
        },
        {}
      )
    )

    return (
      <BasicNotificationModal
        title={notificationTitle(notification) + " NOTIFICATION"}
        body={bodyCopy(notification.content, uniqueRuns)}
      />
    )
  }

  return <Loading />
}

const runScheduleRelationshipForRuns = (
  runs: (Run | null)[]
): [RunScheduleRelationship, RunId | null] => {
  const activitiesWithRunIds = (runs.filter((run) => run != null) as Run[])
    .reduce(
      (acc: [Activity, RunId][], run: Run) =>
        acc.concat(run.activities.map((a) => [a, run.id])),
      []
    )
    .sort((a1, a2) => a1[0].endTime - a2[0].endTime)

  const currentTime = serviceDaySeconds(now())

  const [lastPiece, lastPieceRunId] = activitiesWithRunIds.reduce(
    (
      currentLastPieceWithRunId: [Piece | null, RunId | null],
      activityWithRunId
    ) => {
      if (Object.prototype.hasOwnProperty.call(activityWithRunId[0], "trips")) {
        return [activityWithRunId[0] as Piece, activityWithRunId[1]]
      } else {
        return currentLastPieceWithRunId
      }
    },
    [null, null]
  )

  if (lastPiece && lastPiece.trips.length > 0) {
    const lastRevenueTrip = lastPiece.trips.reduce(
      (currentLastRevenueTrip: Trip | null, trip) => {
        if (
          Object.prototype.hasOwnProperty.call(trip, "routeId") &&
          (trip as Trip).routeId !== null
        ) {
          return trip as Trip
        } else {
          return currentLastRevenueTrip
        }
      },
      null
    )

    if (
      lastRevenueTrip &&
      lastRevenueTrip.routeId &&
      lastRevenueTrip.endTime < currentTime
    ) {
      return ["past", lastPieceRunId]
    }
  }

  for (const a of activitiesWithRunIds) {
    if (
      Object.prototype.hasOwnProperty.call(a[0], "breakType") &&
      a[0].startTime < currentTime &&
      currentTime < a[0].endTime
    ) {
      return ["break", a[1]]
    }
  }

  return ["current", null]
}

const bodyCopy = (
  notification: BlockWaiverNotification,
  runs: (Run | null)[]
): string => {
  if (notification.runIds.length === 0) {
    return "Sorry, there's no additional information that we can provide you about this notification."
  }

  const [relationship, runId] = runScheduleRelationshipForRuns(runs)

  switch (relationship) {
    case "past":
      return `Run ${runId} has ended and is no longer active in Skate.`
    case "break":
      return `Sorry, we can't show you details for run ${runId} because it is on a scheduled break.`
    case "current":
      return notification.startTime < new Date()
        ? pastNotificationBodyCopy(notification)
        : futureNotificationBodyCopy(notification)
  }
}

const pastNotificationBodyCopy = (
  notification: BlockWaiverNotification
): string => {
  if (notification.runIds.length === 1) {
    return `Sorry, we can't show you details for run ${notification.runIds[0]} because nobody is logged into it.`
  }

  return `Sorry, we can't show you details for runs ${notification.runIds.join(
    ", "
  )} because nobody is logged into them.`
}

const futureNotificationBodyCopy = (
  notification: BlockWaiverNotification
): string => {
  if (notification.runIds.length === 1) {
    return `Run ${notification.runIds[0]} is upcoming and not yet active in Skate. Please check back later to see details for this run.`
  }

  return `Runs ${notification.runIds.join(
    ", "
  )} are upcoming and not yet active in Skate. Please check back later to see details for these runs.`
}

export default InactiveNotificationModal
