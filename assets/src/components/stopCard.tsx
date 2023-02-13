import { PointExpression } from "leaflet"
import React, { createContext, useContext, useId } from "react"
import { Popup } from "react-leaflet"
import { DirectionId, Stop } from "../schedule"
import { RoutePill } from "./routePill"
import StreetViewButton from "./streetViewButton"

export type LeafletPaddingOptions = {
  padding?: PointExpression | undefined
  paddingTopLeft?: PointExpression | undefined
  paddingBottomRight?: PointExpression | undefined
}

type StopCardProps = {
  stop: Stop
  direction?: DirectionId
}

type AutoPanProps = {
  autoPanPadding?: LeafletPaddingOptions
}

const StopCard = ({
  stop,
  direction,
  autoPanPadding,
}: StopCardProps & AutoPanProps): JSX.Element => {
  const connectionsLabelId = "stop-card-connections-label-" + useId()

  const connections = stop.connections
    ? stop.connections
        // exclude commuter rail
        .filter((c) => c.type !== 2)
        .sort((a, b) => {
          // non-bubs (i.e. rapid transit) routes go before bus
          if (a.type === 3 && b.type !== 3) {
            return 1
          } else if (a.type !== 3 && b.type === 3) {
            return -1
          } else {
            const aNumeric = Number(a.name)
            const bNumeric = Number(b.name)

            // SL comes before CT, other than that use localeCompare for non-numeric routes
            if (isNaN(aNumeric) && isNaN(bNumeric)) {
              if (a.name.match(/^SL*/) && b.name.match(/^CT*/)) {
                return -1
              } else if (a.name.match(/^CT*/) && b.name.match(/^SL*/)) {
                return 1
              } else {
                return a.name.localeCompare(b.name)
              }
            } else if (isNaN(aNumeric)) {
              // purely numeric routes come last
              return -1
            } else if (isNaN(bNumeric)) {
              return 1
            }

            return aNumeric - bNumeric
          }
        })
    : []

  return (
    <Popup
      pane="popupPane"
      className="m-stop-card"
      closeButton={false}
      offset={[-125, 7]}
      autoPanPadding={autoPanPadding?.padding || [20, 20]}
      autoPanPaddingTopLeft={autoPanPadding?.paddingTopLeft}
      autoPanPaddingBottomRight={autoPanPadding?.paddingBottomRight}
    >
      <div className="m-stop-card__stop-info">
        <div className="m-stop-card__stop-name">{stop.name}</div>
        {direction !== undefined && (
          <div className="m-stop-card__direction">
            {direction == 1 ? "Inbound" : "Outbound"}
          </div>
        )}
      </div>
      {connections.length > 0 ? (
        <div className="m-stop-card__connections">
          <div
            className="m-stop-card__connections-label"
            id={connectionsLabelId}
          >
            Connections
          </div>
          <ul
            className="m-stop-card__connections-pills"
            aria-labelledby={connectionsLabelId}
          >
            {connections.map((c) => (
              <li key={c.id}>
                <RoutePill routeName={c.name} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <StreetViewButton
        latitude={stop.lat}
        longitude={stop.lon}
      ></StreetViewButton>
    </Popup>
  )
}

export const MapSafeArea = createContext<LeafletPaddingOptions>({})

/**
 * A <{@link StopCard}/> which provides it's `autoPanPadding` parameter via the
 * nearest {@link MapSafeArea} Context
 */
export const SafeAreaContextStopCard = (props: StopCardProps) => {
  const safeArea = useContext(MapSafeArea)

  return (
    <>
      <StopCard {...props} autoPanPadding={safeArea} />
    </>
  )
}

export default StopCard
