import React, { useState, useEffect } from "react"
import { Table, Form, Button } from "react-bootstrap"
import { XSquare } from "../helpers/bsIcons"
import { RoutePill } from "./routePill"
import { useCurrentTime } from "../hooks/useCurrentTime"
import { timeAgoLabel, timeAgoLabelFromDate } from "../util/dateTime"
import { SimpleDetour } from "../models/detoursList"
import { EmptyDetourTableIcon } from "../helpers/skateIcons"
import { joinClasses } from "../helpers/dom"
import { Route } from "../schedule"
import { CircleXIcon } from "./circleXIcon"
import { SearchIcon } from "../helpers/icon"
import { fullStoryEvent } from "../helpers/fullStory"

interface DetoursTableProps {
  data: SimpleDetour[]
  onOpenDetour: (detourId: number) => void
  status: DetourStatus
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
  routes,
  routeId,
  setRouteId = () => {},
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

  const resetInputs = () => {
    setRouteId("all")
    setFilter("")
  }

  const filteredData = data.filter((detour) =>
    detour.intersection.toLowerCase().includes(debouncedFilter.toLowerCase())
  )

  return (
    <Table
      hover={!!filteredData.length}
      className={joinClasses([...classNames, "c-detours-table"])}
      variant={status === DetourStatus.Active ? "active-detour" : ""}
    >
      <thead className="u-hide-for-mobile">
        {routes && status === DetourStatus.Closed && (
          <tr className="search-header">
            <th className="search-header__select px-3 py-3">
              <Form.Label htmlFor="route-name">Route</Form.Label>
              <Form.Select
                id="route-name"
                className="mt-2"
                value={routeId}
                onChange={(changeEvent) => {
                  setRouteId(changeEvent.target.value)
                }}
              >
                <option key="" value="all">
                  Please select route
                </option>
                {routes?.map((route: Route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </Form.Select>
            </th>
            <th className="px-3 py-3">
              <div className="c-detour-list-filter">
                <label
                  className="c-detour-list-filter__label"
                  htmlFor="intersection-filter"
                >
                  Starting intersection
                </label>
                <div className="c-detour-list-filter__text">
                  <div className="c-detour-list-filter__input-container">
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
                  </div>
                  <div className="c-detour-list-filter__input-controls">
                    {filter.length > 0 && (
                      <button
                        className="c-detour-list-filter__clear"
                        onClick={() => setFilter("")}
                        title="Clear"
                      >
                        <CircleXIcon />
                      </button>
                    )}
                    <button
                      type="submit"
                      title="Submit"
                      className="c-detour-list-filter__submit"
                      onClick={setDebouncedFilter.bind(null, filter)}
                      disabled={filter.length === 0}
                    >
                      <SearchIcon />
                    </button>
                  </div>
                </div>
              </div>
            </th>
            <th className="px-3 py-3 text-end">
              <Button
                className="icon-link"
                variant="outline-primary"
                data-fs-element="Reset detour search"
                type="button"
                title="Clear Search"
                onClick={resetInputs}
              >
                <XSquare />
                Clear
              </Button>
            </th>
          </tr>
        )}
        <tr>
          <th className="px-3 py-4">Route and direction</th>
          <th className="px-3 py-4 u-hide-for-mobile">Starting Intersection</th>
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
            <td
              colSpan={status === DetourStatus.Active ? 4 : 3}
              className="p-3 p-md-4"
            >
              <EmptyDetourContent message={`No ${status} detours.`} />
            </td>
          </tr>
        )}
      </tbody>
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
