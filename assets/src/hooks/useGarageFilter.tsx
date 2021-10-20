import React from "react"
import { useState } from "react"
import { Route, GarageName } from "../schedule.d"
import { flatten, uniq } from "../helpers/array"

export interface GarageFilterData {
  filteredGarages: GarageName[]
  allGarages: GarageName[]
  handleGarageToggle: (event: React.FormEvent<HTMLInputElement>) => void
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

  const handleGarageToggle = (
    event: React.FormEvent<HTMLInputElement>
  ): void => {
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
    handleGarageToggle,
  }
}

export const GarageFilter = ({
  filteredGarages,
  allGarages,
  handleGarageToggle,
}: GarageFilterData) => {
  const sortedGarages = allGarages.sort((a, b) => a.localeCompare(b))

  return (
    <div className="m-garage-filter">
      {sortedGarages.map((garage) => (
        <div key={garage}>
          <input
            className="m-garage-filter__input"
            type="checkbox"
            value={garage}
            onChange={handleGarageToggle}
            checked={filteredGarages.includes(garage)}
          />
          <label>{garage}</label>
        </div>
      ))}
    </div>
  )
}
