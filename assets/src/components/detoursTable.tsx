import React, { useState, useEffect } from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTime } from "../hooks/useCurrentTime"
import { timeAgoLabel, timeAgoLabelFromDate } from "../util/dateTime"
import { SimpleDetour } from "../models/detoursList"
import { EmptyDetourTableIcon } from "../helpers/skateIcons"
import { joinClasses } from "../helpers/dom"
import { CircleXIcon } from "./circleXIcon"
import { SearchIcon } from "../helpers/icon"
import { fullStoryEvent } from "../helpers/fullStory"

interface DetoursTableProps {
  data: SimpleDetour[]
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
}: DetoursTableProps) => {
  const [filter, setFilter] = useState("")
  const [debouncedFilter, setDebouncedFilter] = useState(filter)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [filter])

  const filteredData = data.filter((detour) =>
    detour.intersection.toLowerCase().includes(debouncedFilter.toLowerCase())
  )

  return (
    <Table
      hover={!!filteredData.length}
      className={joinClasses([...classNames, "c-detours-table"])}
      variant={status === DetourStatus.Active ? "active-detour" : ""}
    >
      <>
        {status === DetourStatus.Closed && (
          <>
            <thead className="u-hide-for-mobile">
              <tr className="search-header">
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">
                  <div className="c-detour-list-filter">
                    <label
                      className="c-detour-list-filter__label"
                      htmlFor="intersection-filter"
                    >
                      Starting intersection
                    </label>
                    <div className="c-detour-list-filter__text">
                      <input
                        id="intersection-filter"
                        type="text"
                        placeholder="Search..."
                        value={filter}
                        onBlur={() =>
                          fullStoryEvent("Detour Intersection Filter Used", {})
                        }
                        onChange={(e) => setFilter(e.target.value)}
                        className="c-detour-list-filter__input"
                      />

                      {filter.length > 0 ? (
                        <button
                          className="c-detour-list-filter__clear"
                          onClick={() => setFilter("")}
                          title="Clear"
                        >
                          <CircleXIcon />
                        </button>
                      ) : null}
                      <button
                        type="submit"
                        title="Submit"
                        className="c-detour-list-filter__submit"
                        onClick={setDebouncedFilter.bind(null, filter)}
                        disabled={filter.length === 0}
                      >
                        <SearchIcon />
                        Search
                      </button>
                    </div>
                  </div>
                </th>
                <th className="px-3 py-3"></th>
              </tr>
              <tr>
                <th className="px-3 py-4">Route and direction</th>
                <th className="px-3 py-4 u-hide-for-mobile">
                  Starting Intersection
                </th>
                <th className="px-3 py-4 u-hide-for-mobile">
                  {timestampLabelFromStatus(status)}
                </th>
              </tr>
            </thead>
          </>
        )}
        {status !== DetourStatus.Closed && (
          <thead className="u-hide-for-mobile">
            <tr>
              <th className="px-3 py-4">Route and direction</th>
              <th className="px-3 py-4 u-hide-for-mobile">
                Starting Intersection
              </th>
              <th className="px-3 py-4 u-hide-for-mobile">
                {timestampLabelFromStatus(status)}
              </th>
              {status === DetourStatus.Active && (
                <th className="px-3 py-4 u-hide-for-mobile">Est. Duration</th>
              )}
            </tr>
          </thead>
        )}
        <tbody>
          {filteredData.length ? (
            <PopulatedDetourRows
              status={status}
              data={filteredData}
              onOpenDetour={onOpenDetour}
            />
          ) : (
            <EmptyDetourRows message={`No ${status} detours.`} />
          )}
        </tbody>
      </>
    </Table>
  )
}

const PopulatedDetourRows = ({
  data,
  status,
  onOpenDetour,
}: {
  data: SimpleDetour[]
  status: DetourStatus
  onOpenDetour: (detourId: number) => void
}) => {
  const epochNow = useCurrentTime()
  const epochNowInSeconds = epochNow.valueOf() / 1000

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
            {status === DetourStatus.Active && detour.activatedAt
              ? timeAgoLabelFromDate(detour.activatedAt, epochNow)
              : timeAgoLabel(epochNowInSeconds, detour.updatedAt)}
          </td>
          {detour.estimatedDuration && (
            <td className="align-middle p-3 u-hide-for-mobile">
              {detour.estimatedDuration}
            </td>
          )}
        </tr>
      ))}
    </>
  )
}

const EmptyDetourRows = ({ message }: { message: string }) => (
  <tr aria-hidden>
    <td colSpan={4} className="p-3 p-md-4">
      <div className="d-flex justify-content-center mb-3">
        <EmptyDetourTableIcon height="100px" width="100px" />
      </div>
      <div className="d-flex justify-content-center">
        <p className="fs-3 fw-light m-0">{message}</p>
      </div>
    </td>
  </tr>
)
