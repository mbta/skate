import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import RoutePropertiesCard, {
  RoutePropertiesCardOpened,
  patternDisplayName,
} from "../../../src/components/mapPage/routePropertiesCard"
import { routePatternFactory } from "../../factories/routePattern"
import routeFactory from "../../factories/route"
import shapeFactory from "../../factories/shape"
import stopFactory from "../../factories/stop"

import { RoutesProvider } from "../../../src/contexts/routesContext"
import userEvent from "@testing-library/user-event"
import {
  ByRoutePatternId,
  Route,
  RoutePattern,
  RoutePatternId,
} from "../../../src/schedule"

const route66 = routeFactory.build({ id: "66", name: "66Name" })
const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
  routeId: "66",
  directionId: 0,
})

const RoutePropertiesCardWithDefaults = ({
  routes = [route66],
  routePatterns = {
    [routePattern1.id]: routePattern1,
    [routePattern2.id]: routePattern2,
  },
  selectedRoutePatternId = routePattern1.id,
  onClose = () => {},
  selectRoutePattern = (_routePattern) => {},
  defaultOpened,
}: {
  routes?: Route[]
  routePatterns?: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId?: RoutePatternId
  onClose?: () => void
  selectRoutePattern?: (routePattern: RoutePattern) => void
  defaultOpened?: RoutePropertiesCardOpened
}) => {
  const thing = (
    <RoutesProvider routes={routes}>
      <RoutePropertiesCard.WithSectionState
        routePatterns={routePatterns}
        selectedRoutePatternId={selectedRoutePatternId}
        selectRoutePattern={selectRoutePattern}
        onClose={onClose}
        defaultOpenSection={defaultOpened}
      />
    </RoutesProvider>
  )

  return thing
}

describe("patternDisplayName", () => {
  test("When not formatted correctly with ' - '", () => {
    const routePattern = routePatternFactory.build({
      name: "BAdFormatted RP",
    })

    expect(patternDisplayName(routePattern)).toEqual({
      name: routePattern.name,
      description: "",
    })
  })
  test("When name formatted correctly and no time description", () => {
    const routePattern = routePatternFactory.build({
      name: "Nubian Station - Harvard Station",
      headsign: "Harvard via Allston",
    })

    expect(patternDisplayName(routePattern)).toEqual({
      name: "Harvard via Allston",
      description: "from Nubian Station",
    })
  })
  test("When name formatted correctly and time description", () => {
    const routePattern = routePatternFactory.build({
      name: "Nubian Station - Harvard Station",
      headsign: "Harvard via Allston",
      timeDescription: "School mornings only",
    })

    expect(patternDisplayName(routePattern)).toEqual({
      name: "Harvard via Allston",
      description: "from Nubian Station, School mornings only",
    })
  })

  test("When name formatted correctly and no headsign", () => {
    const routePattern = routePatternFactory.build({
      name: "Nubian Station - Harvard Station",
      headsign: null,
    })

    expect(patternDisplayName(routePattern)).toEqual({
      name: "Harvard Station",
      description: "from Nubian Station",
    })
  })
})

describe("<RoutePropertiesCard/>", () => {
  describe("Empty when no data to show", () => {
    test("No route data", () => {
      const routePattern = routePatternFactory.build({ routeId: "66" })
      render(
        <RoutePropertiesCardWithDefaults
          routes={[]}
          routePatterns={{ [routePattern.id]: routePattern }}
          selectedRoutePatternId={routePattern.id}
        />
      )

      expect(
        screen.queryByRole("heading", { name: /66Name/ })
      ).not.toBeInTheDocument()
    })
    test("Selected route pattern not among route patterns", () => {
      const routePattern = routePatternFactory.build({ routeId: "66" })
      render(
        <RoutePropertiesCardWithDefaults
          routePatterns={{ [routePattern.id]: routePattern }}
          selectedRoutePatternId={"missingRoutePatternId"}
        />
      )

      expect(
        screen.queryByRole("heading", { name: /66Name/ })
      ).not.toBeInTheDocument()
    })
  })

  describe("Shows the expected data", () => {
    test("Shows the selected pattern's name", () => {
      const routePattern = routePatternFactory.build({ routeId: "66" })
      render(
        <RoutePropertiesCardWithDefaults
          routePatterns={{ [routePattern.id]: routePattern }}
          selectedRoutePatternId={routePattern.id}
          selectRoutePattern={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(
        screen.getByRole("heading", {
          name: patternDisplayName(routePattern).name,
        })
      ).toBeInTheDocument()
    })

    test("Shows the route's other patterns in the same direction", async () => {
      const routePatternOtherDirection = routePatternFactory.build({
        routeId: "66",
        directionId: 1,
      })
      render(
        <RoutePropertiesCardWithDefaults
          routePatterns={{
            [routePattern1.id]: routePattern1,
            [routePattern2.id]: routePattern2,
            [routePatternOtherDirection.id]: routePatternOtherDirection,
          }}
          selectedRoutePatternId={routePattern1.id}
        />
      )
      await userEvent.click(
        screen.getByRole("button", { name: "Show variants" })
      )

      const routePattern1Picker = screen.getByRole("radio", {
        name: new RegExp(patternDisplayName(routePattern1).name),
      })

      const routePattern2Picker = screen.getByRole("radio", {
        name: new RegExp(patternDisplayName(routePattern2).name),
      })

      expect(routePattern1Picker).toBeInTheDocument()
      expect(routePattern1Picker).toBeChecked()

      expect(routePattern2Picker).toBeInTheDocument()
      expect(routePattern2Picker).not.toBeChecked()

      expect(
        screen.queryByRole("radio", {
          name: new RegExp(
            `${patternDisplayName(routePatternOtherDirection).name}`
          ),
        })
      ).not.toBeInTheDocument()
    })

    test("Shows the selected pattern's stops", async () => {
      const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
        routeId: "66",
        directionId: 0,
        shape: shapeFactory.build({
          stops: stopFactory.buildList(2),
        }),
      })

      render(
        <RoutePropertiesCardWithDefaults
          routePatterns={{
            [routePattern1.id]: routePattern1,
            [routePattern2.id]: routePattern2,
          }}
          selectedRoutePatternId={routePattern1.id}
        />
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Show outbound stops" })
      )
      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent)
      ).toEqual(routePattern1.shape!.stops!.map((stop) => stop.name))
    })
  })

  describe("Interactivity", () => {
    test("Changing direction calls selectRoutePattern with the current route pattern in the opposite direction", async () => {
      const routePatternBDirection0 = routePatternFactory.build({
        id: "66-B-0",
        routeId: "66",
        directionId: 0,
      })

      const routePatternBDirection1 = routePatternFactory.build({
        id: "66-B-1",
        directionId: 1,
        sortOrder: 1,
      })

      const routePattern7Direction1 = routePatternFactory.build({
        routeId: "66-7-1",
        directionId: 1,
        sortOrder: 0,
      })
      const mockSelectRoutePattern = jest.fn()
      render(
        <RoutePropertiesCardWithDefaults
          routePatterns={{
            [routePatternBDirection0.id]: routePatternBDirection0,
            [routePatternBDirection1.id]: routePatternBDirection1,
            [routePattern7Direction1.id]: routePattern7Direction1,
          }}
          selectedRoutePatternId={routePatternBDirection0.id}
          selectRoutePattern={mockSelectRoutePattern}
        />
      )

      await userEvent.click(
        screen.getByRole("radio", {
          name: route66.directionNames[1],
        })
      )
      expect(mockSelectRoutePattern).toHaveBeenCalledWith(
        routePatternBDirection1
      )
    })
    test("Changing direction calls selectRoutePattern with the first route pattern in the new direction when the current route pattern doesn't go in the opposite direction", async () => {
      const routePatternDirection0 = routePatternFactory.build({
        routeId: "66",
        directionId: 0,
      })
      const routePatternDirection1_0 = routePatternFactory.build({
        routeId: "66",
        directionId: 1,
        sortOrder: 0,
      })
      const routePatternDirection1_1 = routePatternFactory.build({
        routeId: "66",
        directionId: 1,
        sortOrder: 1,
      })
      const mockSelectRoutePattern = jest.fn()
      render(
        <RoutePropertiesCardWithDefaults
          routePatterns={{
            [routePatternDirection0.id]: routePatternDirection0,
            [routePatternDirection1_1.id]: routePatternDirection1_1,
            [routePatternDirection1_0.id]: routePatternDirection1_0,
          }}
          selectedRoutePatternId={routePatternDirection0.id}
          selectRoutePattern={mockSelectRoutePattern}
        />
      )

      await userEvent.click(
        screen.getByRole("radio", {
          name: route66.directionNames[1],
        })
      )
      expect(mockSelectRoutePattern).toHaveBeenCalledWith(
        routePatternDirection1_0
      )
    })

    test("Clicking a different route pattern calls selectRoutePattern", async () => {
      const mockSelectRoutePattern = jest.fn()

      render(
        <RoutePropertiesCardWithDefaults
          selectRoutePattern={mockSelectRoutePattern}
        />
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Show variants" })
      )

      const routePattern2Radio = screen.getByRole("radio", {
        name: new RegExp(patternDisplayName(routePattern2).name),
      })

      await userEvent.click(routePattern2Radio)
      expect(mockSelectRoutePattern).toHaveBeenCalledWith(routePattern2)
    })

    test("Clicking a different route pattern does not close the variants list", async () => {
      const mockSelectRoutePattern = jest.fn()

      render(
        <RoutePropertiesCardWithDefaults
          selectRoutePattern={mockSelectRoutePattern}
        />
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Show variants" })
      )

      const routePattern2Radio = screen.getByRole("radio", {
        name: new RegExp(patternDisplayName(routePattern2).name),
      })

      await userEvent.click(routePattern2Radio)
      expect(routePattern2Radio).toBeVisible()
    })

    test("Clicking the close button calls onClose prop", async () => {
      const mockOnClose = jest.fn()
      render(<RoutePropertiesCardWithDefaults onClose={mockOnClose} />)

      await userEvent.click(
        screen.getByRole("button", {
          name: "Close",
        })
      )
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("Sections", () => {
    test("Starts out with no sections open", async () => {
      render(<RoutePropertiesCardWithDefaults />)

      expect(screen.getByText("Show outbound stops")).toBeInTheDocument()
      expect(screen.getByText("Show variants")).toBeInTheDocument()
    })

    test("Can open the sections", async () => {
      render(<RoutePropertiesCardWithDefaults />)

      await userEvent.click(screen.getByText("Show variants"))
      expect(screen.getByText("Hide variants")).toBeInTheDocument()

      await userEvent.click(screen.getByText("Show outbound stops"))
      expect(screen.getByText("Hide outbound stops")).toBeInTheDocument()
    })

    test("Opening one section closes the other one", async () => {
      render(<RoutePropertiesCardWithDefaults />)

      await userEvent.click(screen.getByText("Show variants"))
      expect(screen.getByText("Hide variants")).toBeInTheDocument()

      await userEvent.click(screen.getByText("Show outbound stops"))
      expect(screen.getByText("Show variants")).toBeInTheDocument()
      expect(screen.getByText("Hide outbound stops")).toBeInTheDocument()

      await userEvent.click(screen.getByText("Show variants"))
      expect(screen.getByText("Show outbound stops")).toBeInTheDocument()
    })

    test("Can have the variants section open by default", async () => {
      render(<RoutePropertiesCardWithDefaults defaultOpened="variants" />)

      expect(screen.getByText("Show outbound stops")).toBeInTheDocument()
      expect(screen.getByText("Hide variants")).toBeInTheDocument()
    })

    test("Can have the stops section open by default", async () => {
      render(<RoutePropertiesCardWithDefaults defaultOpened="stops" />)

      expect(screen.getByText("Hide outbound stops")).toBeInTheDocument()
      expect(screen.getByText("Show variants")).toBeInTheDocument()
    })
  })
})
