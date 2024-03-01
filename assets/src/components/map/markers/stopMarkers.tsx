import React, { ComponentProps } from "react"
import { Stop } from "../../../schedule"
import { StopMarkerWithInfo } from "./stopMarker"
import { AsProp } from "react-bootstrap/esm/helpers"

type AsProps<As extends React.ElementType> = ComponentProps<As> & AsProp<As>

export const StopMarkers = <
  As extends React.ElementType<{ stop: Stop }> = typeof StopMarkerWithInfo
>({
  as: As = StopMarkerWithInfo,
  stops,

  ...props
}: {
  stops: Stop[]
} & Omit<AsProps<As>, "stop">) => (
  <>
    {stops.map((v) => (
      <As {...props} key={v.id} stop={v} />
    ))}
  </>
)
