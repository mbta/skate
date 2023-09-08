import React, { ComponentPropsWithoutRef, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import { isVehicleInScheduledService } from "../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClasses,
} from "../models/vehicleStatus"
import { Ghost, Vehicle, VehicleInScheduledService } from "../realtime"
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
    <circle cx={50} cy={50} r={50} />
  </svg>
)

const ScheduleAdherenceDescription = ({
  vehicle,
  includePullbackInformation,
  className,
  ...props
}: {
  vehicle: VehicleInScheduledService
  includePullbackInformation?: boolean
} & ComponentPropsWithoutRef<"output">) => (
  <output
    className={joinClasses(["c-schedule-adherence-status", className])}
    {...props}
  >
    {humanReadableScheduleAdherence(vehicle, includePullbackInformation)}
  </output>
)

const secondsToPunctuality = (seconds: number): string =>
  seconds <= 0 ? "early" : "late"

export const scheduleAdherenceLabelString = (seconds: number): string => {
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
    {!vehicle.isOffCourse && vehicle.scheduleAdherenceSecs !== null && (
      <>({scheduleAdherenceLabelString(vehicle.scheduleAdherenceSecs)})</>
    )}
  </output>
)

export interface ScheduleAdherenceProps
  extends ComponentPropsWithoutRef<"output"> {
  vehicle: Vehicle | Ghost
  title?: string
  includePullbackInformation?: boolean
}

export const ScheduleAdherence = ({
  vehicle,
  title,
  className,
  includePullbackInformation,
}: ScheduleAdherenceProps) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  const classes = joinClasses([
    "c-schedule-adherence",
    ...statusClasses(drawnStatus(vehicle), userSettings.vehicleAdherenceColors),
    className,
  ])
  return (
    <output aria-label={title ?? "Schedule Adherence"} className={classes}>
      {isVehicleInScheduledService(vehicle) && !vehicle.isShuttle && (
        <>
          <ScheduleAdherenceStatusIcon />
          <ScheduleAdherenceDescription
            vehicle={vehicle}
            className="label font-xs-semi title-case"
            includePullbackInformation={includePullbackInformation}
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
