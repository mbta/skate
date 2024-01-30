import React, { PropsWithChildren } from "react"
import { Tooltip } from "react-leaflet"

interface MapTooltipProps extends PropsWithChildren {
  permanent?: boolean
}

export const MapTooltip = ({ children, permanent }: MapTooltipProps) => (
  <Tooltip
    /* key is present here to force React to re-render the <MapTooltip /> if the value of permanent changes */
    key={`tooltip-permanent-${permanent}`}
    className="c-map-tooltip"
    direction="top"
    offset={[0, -15]}
    sticky
    permanent={permanent}
  >
    {children}
  </Tooltip>
)
