import React from "react"
import { useState } from "react"
import { Route, GarageName } from "../schedule.d"
import { flatten, uniq } from "../helpers/array"
import { collapseIcon, expandIcon } from "../helpers/icon"

export interface GarageFilterData {
  filteredGarages: GarageName[]
  allGarages: GarageName[]
  toggleGarage: (event: React.FormEvent<HTMLInputElement>) => void
}

export const filterRoutesByGarage = (
  allRoutes: Route[],
  { filteredGarages }: GarageFilterData
): Route[] => {
  if (filteredGarages.length === 0) {
    return allRoutes
  } else {
    return allRoutes.filter(
      (route) =>
        route.garages.find((garage) => filteredGarages.includes(garage)) !==
        undefined
    )
  }
}

export const useGarageFilter = (routes: Route[] | null): GarageFilterData => {
  const [filteredGarages, setFilteredGarages] = useState<GarageName[]>([])

  const toggleGarage = (event: React.FormEvent<HTMLInputElement>): void => {
    const garage: GarageName = event.currentTarget.value

    if (filteredGarages.includes(garage)) {
      setFilteredGarages(
        filteredGarages.filter((filteredGarage) => filteredGarage !== garage)
      )
    } else {
      setFilteredGarages([...filteredGarages, garage])
    }
  }

  const allGarages = uniq(
    flatten((routes || []).map((route) => route.garages))
  ).sort()

  return {
    filteredGarages,
    allGarages,
    toggleGarage,
  }
}

export const GarageFilter = ({
  filteredGarages,
  allGarages,
  toggleGarage,
}: GarageFilterData) => {
  const [showGaragesFilter, setShowGaragesFilter] = useState<boolean>(true)
  const sortedGarages = allGarages.sort((a, b) => a.localeCompare(b))

  return (
    <div className="m-garage-filter">
      <div className="m-garage-filter__header">
        Filter garages
        <button
          className="m-garage-filter__show-hide-button"
          onClick={() => setShowGaragesFilter(!showGaragesFilter)}
        >
          {showGaragesFilter ? collapseIcon() : expandIcon()}
        </button>
      </div>
      {showGaragesFilter
        ? sortedGarages.map((garage) => (
            <div key={garage}>
              <input
                className="m-garage-filter__input"
                type="checkbox"
                value={garage}
                onChange={toggleGarage}
                checked={filteredGarages.includes(garage)}
              />
              <label>{garage}</label>
            </div>
          ))
        : null}
    </div>
  )
}
