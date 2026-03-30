import React from "react"
import { useState } from "react"
import { CircleXIcon } from "../helpers/icon"
import { Route } from "../schedule.d"

export interface RouteFilterData {
  filterText: string
  handleTextInput: (event: React.FormEvent<HTMLInputElement>) => void
  clearTextInput: () => void
}

const byRouteName = (filterText: string) => (route: Route) =>
  route.name.toLowerCase().includes(filterText.toLowerCase())

export const filterRoutes = (
  allRoutes: Route[],
  { filterText }: { filterText: string }
): Route[] => {
  return allRoutes.filter(byRouteName(filterText))
}

export const useRouteFilter = (): RouteFilterData => {
  const [filterText, setFilterText] = useState("")

  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void =>
    setFilterText(event.currentTarget.value)

  const clearTextInput = (): void => setFilterText("")

  return {
    filterText,
    handleTextInput,
    clearTextInput,
  }
}

export const RouteFilter = ({
  filterText,
  handleTextInput,
  clearTextInput,
}: RouteFilterData) => {
  const blurOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  return (
    <div className="input-group-filter">
      <input
        type="text"
        value={filterText}
        placeholder="Search routes"
        onChange={(event) => handleTextInput(event)}
        onKeyDown={blurOnEnter}
      />
      <div>
        {filterText.length > 0 ? (
          <button onClick={clearTextInput} title="Clear">
            <span>
              <CircleXIcon />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
