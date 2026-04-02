import React, { useState, useEffect, useMemo } from "react"
import { Table, Form, Button } from "react-bootstrap"
import { XSquare } from "../helpers/bsIcons"
import { RoutePill } from "./routePill"
import { DateTimePicker } from "./dateTimePicker"
import { useCurrentTime } from "../hooks/useCurrentTime"
import {
  timeAgoLabel,
  timeAgoLabelFromDate,
  dateFromEpochSeconds,
  isSameDay,
  isUpdatedAfterActivated,
} from "../util/dateTime"
import { SimpleDetour } from "../models/detoursList"
import { EmptyDetourTableIcon } from "../helpers/skateIcons"
import { joinClasses } from "../helpers/dom"
import { Route } from "../schedule"
import { CircleXIcon } from "./circleXIcon"
import { SearchIcon } from "../helpers/icon"
import { fullStoryEvent } from "../helpers/fullStory"
import detourReasons from "../data/detourReasons"

interface DetoursTableProps {
  data: SimpleDetour[]
  onOpenDetour: (detourId: number) => void
  status: DetourStatus
  title: React.ReactNode
  routes?: Route[] | null
  routeId?: string
  setRouteId?: (routeId: string) => void
  classNames?: string[]
}

export enum DetourStatus {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

const hasReasonColumn = (status: DetourStatus) =>
  status === DetourStatus.Active || status === DetourStatus.Closed

const columnCount = (status: DetourStatus) => {
  let count = 3 // Route/direction, Starting Intersection, Timestamp
  if (status === DetourStatus.Active) count++ // Est. Duration
  if (hasReasonColumn(status)) count++ // Reason
  return count
}

export const timestampLabelFromStatus = (status: DetourStatus) => {
  switch (status) {
    case DetourStatus.Draft:
      return "Last edited"
    case DetourStatus.Active:
      return "Last published"
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
  title,
  routes,
  routeId,
  setRouteId = () => {},
  classNames = [],
}: DetoursTableProps) => {
  const [filter, setFilter] = useState("")
  const [debouncedFilter, setDebouncedFilter] = useState(filter)
  const [dates, setDates] = useState<Date[]>([])
  const [reason, setReason] = useState<string>("all")
  const hasFilters = routes && status === DetourStatus.Closed

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [filter])

  const resetInputs = () => {
    setRouteId("all")
    setFilter("")
    setDates([])
    setReason("all")
  }

  const filteredData = useMemo(() => {
    let result = data

    if (debouncedFilter !== "") {
      result = result.filter((detour) =>
        detour.intersection
          .toLowerCase()
          .includes(debouncedFilter.toLowerCase())
      )
    }

    if (dates.length > 0) {
      result = result.filter((detour) => {
        const updatedDate = dateFromEpochSeconds(detour.updatedAt)
        return dates.some((date) => isSameDay(date, updatedDate))
      })
    }

    if (reason !== "all") {
      result = result.filter(
        (detour) => reason.toLowerCase() === detour.reason?.toLowerCase()
      )
    }

    return result
  }, [data, debouncedFilter, dates, reason])

  return (
    <>
      <div className="d-flex flex-row justify-content-between align-items-start">
        {title}
        {hasFilters && (
          <Button
            className="icon-link u-hide-for-mobile"
            variant="outline-primary"
            data-fs-element="Reset detour search"
            type="button"
            title="Clear Search"
            onClick={resetInputs}
          >
            <XSquare />
            Clear
          </Button>
        )}
      </div>
      <Table
        hover={!!filteredData.length}
        className={joinClasses([...classNames, "c-detours-table"])}
        variant={status === DetourStatus.Active ? "active-detour" : ""}
      >
        <thead className="u-hide-for-mobile">
          {hasFilters && (
            <tr className="search-header">
              <th className="px-3 py-3">
                <Form.Label htmlFor="route-name">Route</Form.Label>
                <Form.Select
                  id="route-name"
                  className="select-filter mt-2"
                  value={routeId}
                  onChange={(changeEvent) => {
                    setRouteId(changeEvent.target.value)
                  }}
                >
                  <option key="" value="all">
                    Select route
                  </option>
                  {routes?.map((route: Route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </Form.Select>
              </th>
              <th className="px-3 py-3">
                <label htmlFor="intersection-filter">
                  Starting intersection
                </label>
                <div className="input-group-filter mt-2">
                  <input
                    id="intersection-filter"
                    type="text"
                    placeholder="Search..."
                    value={filter}
                    onBlur={() =>
                      fullStoryEvent("Detour Intersection Filter Used", {})
                    }
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <div>
                    {filter.length > 0 && (
                      <button onClick={() => setFilter("")} title="Clear">
                        <span>
                          <CircleXIcon />
                        </span>
                      </button>
                    )}
                    <button
                      type="submit"
                      title="Submit"
                      onClick={setDebouncedFilter.bind(null, filter)}
                      disabled={filter.length === 0}
                    >
                      <span>
                        <SearchIcon />
                      </span>
                    </button>
                  </div>
                </div>
              </th>
              <th className="px-3 py-3 c-detours-table__col-sm">
                <Form.Label htmlFor="reason-name">Reason</Form.Label>
                <Form.Select
                  id="reason-name"
                  className="select-filter mt-2"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value)
                  }}
                >
                  <option key="" value="all">
                    Select reason
                  </option>
                  {detourReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Form.Select>
              </th>
              <th className="px-3 py-3 c-detours-table__col-sm">
                <div>
                  <label htmlFor="date-filter">Date</label>
                  <DateTimePicker
                    className="mt-2"
                    value={dates}
                    options={{
                      maxDate: "today",
                      onChange: setDates,
                      mode: "multiple",
                    }}
                  />
                </div>
              </th>
            </tr>
          )}
          <tr>
            <th className="px-3 py-4">Route and direction</th>
            <th className="px-3 py-4 u-hide-for-mobile">
              Starting Intersection
            </th>
            {hasReasonColumn(status) && (
              <th className="px-3 py-4 u-hide-for-mobile">Reason</th>
            )}
            <th className="px-3 py-4 u-hide-for-mobile">
              {timestampLabelFromStatus(status)}
            </th>
            {status === DetourStatus.Active && (
              <th className="px-3 py-4 u-hide-for-mobile">Est. Duration</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredData.length ? (
            <PopulatedDetourRows
              status={status}
              data={filteredData}
              onOpenDetour={onOpenDetour}
            />
          ) : (
            <tr aria-hidden>
              <td colSpan={columnCount(status)} className="p-3 p-md-4">
                <EmptyDetourContent message={`No ${status} detours.`} />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
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
          {hasReasonColumn(status) && (
            <td className="align-middle p-3 u-hide-for-mobile">
              {detour.reason}
            </td>
          )}
          <td className="align-middle p-3 u-hide-for-mobile">
            {status === DetourStatus.Active && detour.activatedAt ? (
              <>
                {isUpdatedAfterActivated(detour) && (
                  <div className="time-pill mb-1">
                    {timeAgoLabel(epochNowInSeconds, detour.updatedAt)} - Edited
                  </div>
                )}
                <div>{timeAgoLabelFromDate(detour.activatedAt, epochNow)}</div>
              </>
            ) : (
              timeAgoLabel(epochNowInSeconds, detour.updatedAt)
            )}
          </td>
          {status === DetourStatus.Active && detour.estimatedDuration && (
            <td className="align-middle p-3 u-hide-for-mobile">
              {detour.estimatedDuration}
            </td>
          )}
        </tr>
      ))}
    </>
  )
}

const EmptyDetourContent = ({ message }: { message: string }) => (
  <>
    <div className="d-flex justify-content-center mb-3">
      <EmptyDetourTableIcon height="100px" width="100px" />
    </div>
    <div className="d-flex justify-content-center">
      <p className="fs-3 fw-light m-0">{message}</p>
    </div>
  </>
)
