import React, { useId } from "react"
import { Popup } from "react-leaflet"
import { DirectionId, Stop } from "../schedule"
import { RoutePill } from "./routePill"
import StreetViewButton from "./streetViewButton"

const StopCard = ({
  stop,
  direction,
}: {
  stop: Stop
  direction?: DirectionId
}): JSX.Element => {
  const connectionsLabelId = "stop-card-connections-label-" + useId()

  const connections = stop.connections
    ? stop.connections
        .filter((c) => c.type !== 2)
        .sort((a, b) => {
          if (a.type === 3 && b.type !== 3) {
            return 1
          } else if (a.type !== 3 && b.type === 3) {
            return -1
          } else {
            const aNumeric = Number(a.name)
            const bNumeric = Number(b.name)

            if (isNaN(aNumeric) && isNaN(bNumeric)) {
              if (a.name.match(/^SL*/) && b.name.match(/^CT*/)) {
                return -1
              } else if (a.name.match(/^CT*/) && b.name.match(/^SL*/)) {
                return 1
              } else {
                return a.name.localeCompare(b.name)
              }
            } else if (isNaN(aNumeric)) {
              return -1
            } else if (isNaN(bNumeric)) {
              return 1
            }

            return aNumeric - bNumeric
          }
        })
    : []

  return (
    <Popup className="m-stop-card" closeButton={false} offset={[-125, 7]}>
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

export default StopCard
