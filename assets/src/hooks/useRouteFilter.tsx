import React from "react"
import { useState } from "react"
import { circleXIcon } from "../helpers/icon"
import { Route } from "../skate"

type FilterType = "id"

export interface RouteFilterData {
  filterType: FilterType
  filterText: string
  handleTypeChange: (event: React.FormEvent<HTMLSelectElement>) => void
  handleTextInput: (event: React.FormEvent<HTMLInputElement>) => void
  clearTextInput: () => void
}

const isFilterType = (str: string): str is FilterType => str === "id"

export const filterRoutes = (
  allRoutes: Route[],
  { filterType, filterText }: { filterType: FilterType; filterText: string }
): Route[] => {
  switch (filterType) {
    case "id":
      return allRoutes.filter((route: Route) => route.id.includes(filterText))
  }
}

export const useRouteFilter = (): RouteFilterData => {
  const initialFilterType: FilterType = "id"
  const [filterType, setFilterType] = useState(initialFilterType)
  const [filterText, setFilterText] = useState("")

  const handleTypeChange = (
    event: React.FormEvent<HTMLSelectElement>
  ): void => {
    if (isFilterType(event.currentTarget.value)) {
      setFilterType(event.currentTarget.value)
    }
  }

  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void =>
    setFilterText(event.currentTarget.value)

  const clearTextInput = (): void => setFilterText("")

  return {
    filterType,
    filterText,
    handleTypeChange,
    handleTextInput,
    clearTextInput,
  }
}

export const RouteFilter = ({
  filterType,
  filterText,
  handleTypeChange,
  handleTextInput,
  clearTextInput,
}: RouteFilterData) => {
  const blurOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  return (
    <div className="m-route-filter">
      <select
        className="m-route-filter__type"
        value={filterType}
        onChange={handleTypeChange}
      >
        <option value="id">Route ID</option>
      </select>
      <div className="m-route-filter__text">
        <input
          className="m-route-filter__input"
          type="text"
          value={filterText}
          onChange={handleTextInput}
          onKeyDown={blurOnEnter}
        />
        <button className="m-route-filter__clear" onClick={clearTextInput}>
          {circleXIcon()}
        </button>
      </div>
    </div>
  )
}
