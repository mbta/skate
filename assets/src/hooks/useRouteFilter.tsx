import React from "react"
import { useState } from "react"
import { circleXIcon, searchIcon } from "../helpers/icon"
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
  const [inputHasFocus, setInputHasFocus] = useState<boolean>(false)
  const [inputHasText, setInputHasText] = useState<boolean>(false)
  const blurOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  return (
    <div className="m-route-filter">
      <div className="m-route-filter__text" id="route-filter-text">
        <input
          className="m-route-filter__input"
          type="text"
          value={filterText}
          placeholder="Search routes"
          onChange={(event) => {
            if (event.currentTarget.value.length > 0) {
              setInputHasText(true)
            } else {
              setInputHasText(false)
            }
            handleTextInput(event)
          }}
          onKeyDown={blurOnEnter}
          onFocus={() => setInputHasFocus(true)}
          onBlur={(e) => {
            const input = document.getElementById("route-filter-text")
            if (!input?.contains(e.relatedTarget)) {
              setInputHasFocus(false)
            }
          }}
        />
        {inputHasFocus && inputHasText ? (
          <button
            className="m-route-filter__clear"
            onClick={() => {
              setInputHasText(false)
              clearTextInput()
            }}
          >
            {circleXIcon()}
          </button>
        ) : (
          <button className="m-route-filter__search">{searchIcon()}</button>
        )}
      </div>
    </div>
  )
}
