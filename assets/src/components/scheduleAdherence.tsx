import React, { ComponentPropsWithoutRef, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import { isVehicle } from "../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClasses,
} from "../models/vehicleStatus"
import { VehicleInScheduledService, VehicleOrGhost } from "../realtime"
import { secondsToMinutes } from "../util/dateTime"

const ScheduleAdherenceStatusIcon = () => (
  <svg
    role="img"
    aria-label=""
    aria-hidden={true}
    viewBox="0 0 100 100"
    width={8}
    height={8}
    className="c-schedule-adherence__status-icon"
  >
    <circle cx={50} cy={50} r={40} />
  </svg>
)

const ScheduleAdherenceDescription = ({
  vehicle,
  className,
  ...props
}: {
  vehicle: VehicleInScheduledService
} & ComponentPropsWithoutRef<"output">) => (
  <output
    className={joinClasses(["c-schedule-adherence-status", className])}
    {...props}
  >
    {humanReadableScheduleAdherence(vehicle)}
  </output>
)

const secondsToPunctuality = (seconds: number): string =>
  seconds <= 0 ? "early" : "late"

export const scheduleAdherenceLabelString = ({
  scheduleAdherenceSecs: seconds,
}: VehicleInScheduledService): string => {
  const minutes = secondsToMinutes(seconds)
  const punctuality = secondsToPunctuality(seconds)
  return `${minutes} min ${punctuality}`
}

const ScheduleAdherenceMetric = ({
  vehicle,
  className,
  ...props
}: {
  vehicle: VehicleInScheduledService
} & ComponentPropsWithoutRef<"output">) => (
  <output className={`c-vehicle-adherence-label ${className}`} {...props}>
    {!vehicle.isOffCourse && <>({scheduleAdherenceLabelString(vehicle)})</>}
  </output>
)

export interface ScheduleAdherenceProps
  extends ComponentPropsWithoutRef<"output"> {
  vehicle: VehicleOrGhost
  title?: string
}

export const ScheduleAdherence = ({
  vehicle,
  title,
  className,
}: ScheduleAdherenceProps) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  const classes = joinClasses([
    "c-schedule-adherence",
    ...statusClasses(drawnStatus(vehicle), userSettings.vehicleAdherenceColors),
    className,
  ])
  return (
    <output aria-label={title ?? "Schedule Adherence"} className={classes}>
      {isVehicle(vehicle) && !vehicle.isShuttle && (
        <>
          <ScheduleAdherenceStatusIcon />
          <ScheduleAdherenceDescription
            vehicle={vehicle}
            className="label font-xs-semi title-case"
          />
          &nbsp;
          <ScheduleAdherenceMetric
            vehicle={vehicle}
            className="label font-xs-reg"
          />
        </>
      )}
    </output>
  )
}
