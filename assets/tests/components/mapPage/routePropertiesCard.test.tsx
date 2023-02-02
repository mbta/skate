import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import RoutePropertiesCard from "../../../src/components/mapPage/routePropertiesCard"
import { routePatternFactory } from "../../factories/routePattern"
import routeFactory from "../../factories/route"
import shapeFactory from "../../factories/shape"
import stopFactory from "../../factories/stop"

import { RoutesProvider } from "../../../src/contexts/routesContext"
import userEvent from "@testing-library/user-event"

const route66 = routeFactory.build({ id: "66" })

describe("<RoutePropertiesCard/>", () => {
  describe("Empty when no data to show", () => {
    test("No route data", () => {
      const routePattern = routePatternFactory.build({ routeId: "66" })
      render(
        <RoutesProvider routes={[]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{ [routePattern.id]: routePattern }}
            selectedRoutePatternId={routePattern.id}
            selectRoutePattern={jest.fn()}
            onClose={jest.fn()}
          />
        </RoutesProvider>
      )

      expect(
        screen.queryByRole("heading", { name: /66/ })
      ).not.toBeInTheDocument()
    })
    test("Selected route pattern not among route patterns", () => {
      const routePattern = routePatternFactory.build({ routeId: "66" })
      render(
        <RoutePropertiesCard
          routeId="66"
          routePatterns={{ [routePattern.id]: routePattern }}
          selectedRoutePatternId={"missingRoutePatternId"}
          selectRoutePattern={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(
        screen.queryByRole("heading", { name: /66/ })
      ).not.toBeInTheDocument()
    })
  })

  describe("Shows the expected data", () => {
    test("Shows the selected pattern's name", () => {
      const routePattern = routePatternFactory.build({ routeId: "66" })
      render(
        <RoutesProvider routes={[route66]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{ [routePattern.id]: routePattern }}
            selectedRoutePatternId={routePattern.id}
            selectRoutePattern={jest.fn()}
            onClose={jest.fn()}
          />
        </RoutesProvider>
      )

      expect(
        screen.getByRole("heading", { name: `66 ${routePattern.name}` })
      ).toBeInTheDocument()
    })

    test("Shows the route's other patterns in the same direction", () => {
      const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
        routeId: "66",
        directionId: 0,
      })
      const routePatternOtherDirection = routePatternFactory.build({
        routeId: "66",
        directionId: 1,
      })
      render(
        <RoutesProvider routes={[route66]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{
              [routePattern1.id]: routePattern1,
              [routePattern2.id]: routePattern2,
              [routePatternOtherDirection.id]: routePatternOtherDirection,
            }}
            selectedRoutePatternId={routePattern1.id}
            selectRoutePattern={jest.fn()}
            onClose={jest.fn()}
          />
        </RoutesProvider>
      )

      const routePattern1Picker = screen.getByRole("radio", {
        name: routePattern1.name,
      })

      const routePattern2Picker = screen.getByRole("radio", {
        name: routePattern2.name,
      })

      expect(routePattern1Picker).toBeInTheDocument()
      expect(routePattern1Picker).toBeChecked()

      expect(routePattern2Picker).toBeInTheDocument()
      expect(routePattern2Picker).not.toBeChecked()

      expect(
        screen.queryByRole("radio", { name: routePatternOtherDirection.name })
      ).not.toBeInTheDocument()
    })

    test("Shows the selected pattern's stops", () => {
      const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
        routeId: "66",
        directionId: 0,
        shape: shapeFactory.build({
          stops: stopFactory.buildList(2),
        }),
      })

      render(
        <RoutesProvider routes={[route66]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{
              [routePattern1.id]: routePattern1,
              [routePattern2.id]: routePattern2,
            }}
            selectedRoutePatternId={routePattern1.id}
            selectRoutePattern={jest.fn()}
            onClose={jest.fn()}
          />
        </RoutesProvider>
      )

      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent)
      ).toEqual(routePattern1.shape!.stops!.map((stop) => stop.name))
    })
  })

  describe("Interactivity", () => {
    test("Changing direction calls selectRoutePattern with the first route pattern in the new direction", async () => {
      const routePatternDirection0 = routePatternFactory.build({
        routeId: "66",
        directionId: 0,
      })
      const routePatternDirection1_0 = routePatternFactory.build({
        routeId: "66",
        directionId: 0,
        sortOrder: 0,
      })
      const routePatternDirection1_1 = routePatternFactory.build({
        routeId: "66",
        directionId: 0,
        sortOrder: 1,
      })
      const mockSelectRoutePattern = jest.fn()
      render(
        <RoutesProvider routes={[route66]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{
              [routePatternDirection0.id]: routePatternDirection0,
              [routePatternDirection1_1.id]: routePatternDirection1_1,
              [routePatternDirection1_0.id]: routePatternDirection1_0,
            }}
            selectedRoutePatternId={routePatternDirection0.id}
            selectRoutePattern={mockSelectRoutePattern}
            onClose={jest.fn()}
          />
        </RoutesProvider>
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
      const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
        routeId: "66",
        directionId: 0,
      })
      const mockSelectRoutePattern = jest.fn()
      render(
        <RoutesProvider routes={[route66]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{
              [routePattern1.id]: routePattern1,
              [routePattern2.id]: routePattern2,
            }}
            selectedRoutePatternId={routePattern1.id}
            selectRoutePattern={mockSelectRoutePattern}
            onClose={jest.fn()}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("radio", {
          name: routePattern2.name,
        })
      )
      expect(mockSelectRoutePattern).toHaveBeenCalledWith(routePattern2)
    })

    test("Clicking the close button calls onClose prop", async () => {
      const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
        routeId: "66",
        directionId: 0,
      })
      const mockOnClose = jest.fn()
      render(
        <RoutesProvider routes={[route66]}>
          <RoutePropertiesCard
            routeId="66"
            routePatterns={{
              [routePattern1.id]: routePattern1,
              [routePattern2.id]: routePattern2,
            }}
            selectedRoutePatternId={routePattern1.id}
            selectRoutePattern={jest.fn()}
            onClose={mockOnClose}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", {
          name: "Close",
        })
      )
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
