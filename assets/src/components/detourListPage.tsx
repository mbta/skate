import React from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { timeAgoLabel } from "../util/dateTime"

export const DetourListPage = () => {
  const fakeData = [
    {
      number: 45,
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      number: 83,
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      number: 83,
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
  ]

  const epochNowInSeconds = useCurrentTimeSeconds()

  return (
    <>
      <Table bordered hover className="c-detour-table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Starting Intersection</th>
            <th>On detour since</th>
          </tr>
        </thead>
        <tbody>
          {fakeData.map((detour) => (
            <tr>
              <td className="align-middle">
                <div className="c-detour-table__route-info-cell">
                  <RoutePill routeName={detour.number.toString()} />
                  <div className="c-detour-table__route-info-text">
                    <span>{detour.direction}</span>
                    <span className="c-detour-table__route-info-text--bold">
                      {detour.name}
                    </span>
                  </div>
                </div>
              </td>
              <td className="align-middle">{detour.intersection}</td>
              <td className="align-middle">
                {timeAgoLabel(epochNowInSeconds, detour.activeSince)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}
