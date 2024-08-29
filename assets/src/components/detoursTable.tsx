import React from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { timeAgoLabel } from "../util/dateTime"
import { Detour } from "./detourListPage"

interface DetoursTableProps {
  data: Detour[]
}

export const DetoursTable = ({ data }: DetoursTableProps) => {
  const epochNowInSeconds = useCurrentTimeSeconds()

  return (
    <Table hover className="c-detours-table">
      <thead>
        <tr>
          <th className="px-3 py-4">Route and direction</th>
          <th className="px-3 py-4 u-hide-for-mobile">Starting Intersection</th>
          <th className="px-3 py-4 u-hide-for-mobile">On detour since</th>
        </tr>
      </thead>
      <tbody>
        {data.map((detour, index) => (
          <tr key={index}>
            <td className="align-middle p-3">
              <div className="d-flex">
                <RoutePill routeName={detour.route} />
                <div className="c-detours-table__route-info-text d-inline-block">
                  <div className="pb-1 fs-4 fw-bold">{detour.name}</div>
                  <div className="c-detours-table__route-info-direction fs-6">
                    {detour.direction}
                  </div>
                </div>
              </div>
            </td>
            <td className="align-middle p-3 u-hide-for-mobile">
              {detour.intersection}
            </td>
            <td className="align-middle p-3 u-hide-for-mobile">
              {timeAgoLabel(epochNowInSeconds, detour.activeSince)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
