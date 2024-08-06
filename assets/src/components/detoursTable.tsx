import React from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { timeAgoLabel } from "../util/dateTime"
import { Detour } from "./detourListPage"

interface DetoursTableProps {
  className: string
  data: Detour[]
}

export const DetoursTable= ({
  className,
  data
}: DetoursTableProps) => {

  const epochNowInSeconds = useCurrentTimeSeconds()

  return (
    <Table hover className={`c-detours-table ${className}`}>
      <thead>
        <tr>
          <th>Route</th>
          <th className="u-hide-for-mobile">Starting Intersection</th>
          <th className="u-hide-for-mobile">On detour since</th>
        </tr>
      </thead>
      <tbody>
        {data.map((detour, index) => (
          <tr key={index}>
            <td className="align-middle">
              <div className="c-detours-table__route-info-cell">
                <RoutePill routeName={detour.number.toString()} />
                <div className="c-detours-table__route-info-text">
                  <span>{detour.direction}</span>
                  <span className="c-detours-table__route-info-text--bold">
                    {detour.name}
                  </span>
                </div>
              </div>
            </td>
            <td className="align-middle u-hide-for-mobile">{detour.intersection}</td>
            <td className="align-middle u-hide-for-mobile">
              {timeAgoLabel(epochNowInSeconds, detour.activeSince)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
