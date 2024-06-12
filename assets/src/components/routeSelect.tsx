import React, { useEffect, useState } from "react"
import { autocompleteOption } from "./groupedAutocomplete"
import { Combobox } from "./searchForm"
import { Route } from "../schedule"

interface RouteSelectProps {
  routes: Route[]
  selectedRoute: Route | null
  onSelectRoute: (route: Route | undefined) => void
}

export const RouteSelect = ({
  routes,
  selectedRoute,
  onSelectRoute,
}: RouteSelectProps) => {
  const [inputText, setInputText] = useState(selectedRoute?.id || "")
  const [filteredRoutes, setFilteredRoutes] = useState(routes)

  useEffect(() => {
    handleInputTextChange(selectedRoute?.id || "")
  }, [selectedRoute])

  const filterRoutes = (routeId: string) => {
    const filteredRoutes = routeId.length
      ? routes.filter((route) => route.id.startsWith(routeId))
      : routes
    setFilteredRoutes(filteredRoutes)
  }

  const handleInputTextChange = (input: string) => {
    setInputText(input)
    filterRoutes(input)
  }

  const handleOptionSelect = (route: Route) => () => {
    setInputText(route.id)
    onSelectRoute(route)
  }

  const handleInputSubmit = (routeId: string) => {
    const selectedRoute = routes.find((route) => route.id === routeId)
    onSelectRoute(selectedRoute)
  }

  // Make selectable options from routes
  const options = filteredRoutes.map((route) =>
    autocompleteOption(route.id, handleOptionSelect(route))
  )

  return (
    <>
      <Combobox
        options={options}
        inputText={inputText}
        onInputTextChange={(e) => handleInputTextChange(e.target.value)}
        onSubmit={() => handleInputSubmit(inputText)}
        onClear={() => handleInputSubmit("")}
        comboboxType="select"
        dispatch={null}
        query={null}
      />
    </>
  )
}
