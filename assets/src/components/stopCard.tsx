import { PointExpression } from "leaflet"
import React, { useContext, useId } from "react"
import { Popup } from "react-leaflet"
import { RouteId, Stop } from "../schedule"
import { MapSafeAreaContext } from "../contexts/mapSafeAreaContext"
import { RoutePill } from "./routePill"
import StreetViewButton from "./streetViewButton"

export type LeafletPaddingOptions = {
  padding?: PointExpression | undefined
  paddingTopLeft?: PointExpression | undefined
  paddingBottomRight?: PointExpression | undefined
}

type StopCardProps = {
  stop: Stop
}

type AutoPanProps = {
  autoPanPadding?: LeafletPaddingOptions
}

const sortRoutes = (
  routes: { type: number; id: RouteId; name: string }[]
): { type: number; id: RouteId; name: string }[] =>
  routes
    // exclude commuter rail
    .filter((c) => c.type !== 2)
    .sort((a, b) => {
      // non-bus (i.e. rapid transit) routes go before bus
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

const StopCard = ({
  stop,
  autoPanPadding,
}: StopCardProps & AutoPanProps): JSX.Element => {
  const routesLabelId = "stop-card-routes-label-" + useId()

  const routes = sortRoutes(stop.routes || [])

  return (
    <Popup
      pane="popupPane"
      className="c-stop-card"
      closeButton={false}
      offset={[-125, 7]}
      autoPanPadding={autoPanPadding?.padding || [20, 20]}
      autoPanPaddingTopLeft={autoPanPadding?.paddingTopLeft}
      autoPanPaddingBottomRight={autoPanPadding?.paddingBottomRight}
      // Leaflet implements Popup as a singleton, which means that the
      // autoPanPadding setting won't be updated because it is only
      // applied when the `<Popup/>` is created.  Setting a key that
      // has a stringified version of the autoPanPadding settings will
      // cause the Popup to get re-created if that key changes, which
      // means that changing autoPanPadding will be reflected.
      key={JSON.stringify(autoPanPadding)}
    >
      <div className="c-stop-card__stop-info">
        <div className="c-stop-card__stop-name">{stop.name}</div>
      </div>
      {routes.length > 0 ? (
        <div className="c-stop-card__routes">
          <div className="c-stop-card__routes-label" id={routesLabelId}>
            Routes
          </div>
          <ul
            className="c-stop-card__routes-pills"
            aria-labelledby={routesLabelId}
          >
            {routes.map((c) => (
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

/**
 * A <{@link StopCard}/> which provides it's `autoPanPadding` parameter via the
 * nearest {@link MapSafeAreaContext} Context
 */
const StopCardWithSafeArea = (props: StopCardProps) => {
  const safeArea = useContext(MapSafeAreaContext)

  return <StopCard {...props} autoPanPadding={safeArea} />
}

/** @borrows StopCardWithSafeArea as StopCard#WithSafeArea  */
StopCard.WithSafeArea = StopCardWithSafeArea

export default StopCard
