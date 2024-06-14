import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { RouteSelect } from "../../src/components/routeSelect"
import routeFactory from "../factories/route"
import { Route } from "../../src/schedule"
import { clearButton, searchInput } from "../testHelpers/selectors/components/searchForm"

import {
  option as autocompleteOption,
  listbox,
} from "../testHelpers/selectors/components/groupedAutocomplete"
describe("RouteSelect", () => {
  describe("select combobox", () => {
    const route1 = routeFactory.build({ id: "1", name: "1" })
    const route39 = routeFactory.build({ id: "39", name: "39" })
    const route66 = routeFactory.build({ id: "66", name: "66" })

    const allRoutes = [route1, route39, route66]

    const RouteSelectWrapper: React.FC<{
      selectedRoute?: Route
    }> = ({selectedRoute}) => {
      const onSelectOption = jest.fn()
      return (
        <RouteSelect
          routes={allRoutes}
          selectedRoute={selectedRoute || null}
          onSelectRoute={onSelectOption}
        />
      )
    }

    test("on initial render, when there is no input text, all routes are selectable", () => {
      const {baseElement} = render(<RouteSelectWrapper />)
      expect(baseElement).toMatchSnapshot()
    })

    test("when input is empty, should not display clear button", () => {
      render(<RouteSelectWrapper />)
      expect(clearButton.query()).not.toBeInTheDocument()
    })
  
    test("when input is not empty, should display clear button", async () => {
      render(<RouteSelectWrapper />)
      await userEvent.type(searchInput.get(), "3")
  
      expect(clearButton.get()).toBeInTheDocument()
    })

    test("clicking the clear button empties the input", async () => {
      render(<RouteSelectWrapper />)
      await userEvent.type(searchInput.get(), "3")
      await userEvent.click(clearButton.get())
  
      expect(searchInput.get()).toHaveValue("")
    })

    test("when input is not empty, dropdown is visible", async () => {
      render(<RouteSelectWrapper />)

      await userEvent.type(searchInput.get(), "3")
  
      expect(listbox().get()).toBeInTheDocument()
    })

    test("when input is not empty, routes are filtered", async () => {
      render(<RouteSelectWrapper />)
      await userEvent.type(searchInput.get(), "3")
  
      expect(autocompleteOption("1").query()).not.toBeInTheDocument()
      expect(autocompleteOption("66").query()).not.toBeInTheDocument()
    })
  })
})