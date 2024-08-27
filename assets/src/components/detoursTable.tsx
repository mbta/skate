import React from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { timeAgoLabel } from "../util/dateTime"
import { DraftDetours } from "../models/detours"

interface DetoursTableProps {
  data: DraftDetours
}

export const DraftDetoursTable = ({ data }: DetoursTableProps) => {
  console.log("DATA", data)
  const epochNowInSeconds = useCurrentTimeSeconds()

  return (
    <Table hover className="c-detours-table">
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
                <RoutePill routeName={detour.route} />
                <div className="c-detours-table__route-info-text">
                  <span>{detour.direction}</span>
                  <span className="fw-bold">{detour.name}</span>
                </div>
              </div>
            </td>
            <td className="align-middle u-hide-for-mobile">
              {detour.intersection}
            </td>
            <td className="align-middle u-hide-for-mobile">
              {timeAgoLabel(epochNowInSeconds, detour.activeSince)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
