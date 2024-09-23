import React from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { timeAgoLabel } from "../util/dateTime"
import { SimpleDetour } from "../models/detoursList"
import { EmptyDetourTableIcon } from "../helpers/skateIcons"
import { joinClasses } from "../helpers/dom"

interface DetoursTableProps {
  data: SimpleDetour[] | undefined
  onOpenDetour: (detourId: number) => void
  status: DetourStatus
  classNames?: string[]
}

export enum DetourStatus {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

export const timestampLabelFromStatus = (status: DetourStatus) => {
  switch (status) {
    case DetourStatus.Draft:
      return "Last edited"
    case DetourStatus.Active:
      return "On detour since"
    case DetourStatus.Closed:
      return "Last used"
    default:
      throw "Invalid detour status"
  }
}

export const DetoursTable = ({
  data,
  onOpenDetour,
  status,
  classNames = [],
}: DetoursTableProps) => (
  <Table
    hover={!!data}
    className={joinClasses([...classNames, "c-detours-table"])}
  >
    <thead className="u-hide-for-mobile">
      <tr>
        <th className="px-3 py-4">Route and direction</th>
        <th className="px-3 py-4 u-hide-for-mobile">Starting Intersection</th>
        <th className="px-3 py-4 u-hide-for-mobile">
          {timestampLabelFromStatus(status)}
        </th>
      </tr>
    </thead>
    <tbody>
      {data ? (
        <PopulatedDetourRows data={data} onOpenDetour={onOpenDetour} />
      ) : (
        <EmptyDetourRows message={`No ${status} detours.`} />
      )}
    </tbody>
  </Table>
)

const PopulatedDetourRows = ({
  data,
  onOpenDetour,
}: {
  data: SimpleDetour[]
  onOpenDetour: (detourId: number) => void
}) => {
  const epochNowInSeconds = useCurrentTimeSeconds()

  return (
    <>
      {data.map((detour, index) => (
        <tr key={index} onClick={() => onOpenDetour(detour.id)}>
          <td className="align-middle p-3">
            <div className="d-flex">
              <RoutePill routeName={detour.route} />
              <div className="c-detours-table__route-info-text d-inline-block">
                <div className="pb-1 fs-4 fw-semibold">{detour.name}</div>
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
            {timeAgoLabel(epochNowInSeconds, detour.updatedAt)}
          </td>
        </tr>
      ))}
    </>
  )
}

const EmptyDetourRows = ({ message }: { message: string }) => (
  <tr aria-hidden>
    <td colSpan={3} className="p-3 p-md-4">
      <div className="d-flex justify-content-center mb-3">
        <EmptyDetourTableIcon height="100px" width="100px" />
      </div>
      <div className="d-flex justify-content-center">
        <p className="fs-3 fw-light m-0">{message}</p>
      </div>
    </td>
  </tr>
)
