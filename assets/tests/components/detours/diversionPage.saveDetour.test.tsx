import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React, { act } from "react"
import "@testing-library/jest-dom/jest-globals"
import {
  fetchNearestIntersection,
  fetchRoutePatterns,
  putDetourUpdate,
} from "../../../src/api"
import {
  DiversionPage as DiversionPageDefault,
  DiversionPageProps,
} from "../../../src/components/detours/diversionPage"
import userEvent from "@testing-library/user-event"
import { originalRouteShape } from "../../testHelpers/selectors/components/detours/diversionPage"
import { Ok } from "../../../src/util/result"
import { neverPromise } from "../../testHelpers/mockHelpers"

import { originalRouteFactory } from "../../factories/originalRouteFactory"
import getTestGroups from "../../../src/userTestGroups"
import { routePatternFactory } from "../../factories/routePattern"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import routeFactory from "../../factories/route"

const DiversionPage = (props: Partial<DiversionPageProps>) => {
  return (
    <DiversionPageDefault
      originalRoute={originalRouteFactory.build()}
      onClose={() => null}
      onOpenDetour={() => null}
      {...props}
    />
  )
}

jest.mock("../../../src/api")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(fetchRoutePatterns).mockReturnValue(neverPromise())
  jest.mocked(getTestGroups).mockReturnValue([])
  jest.mocked(fetchNearestIntersection).mockReturnValue(neverPromise())
  jest.mocked(putDetourUpdate).mockReturnValue(neverPromise())
})

describe("DiversionPage autosave flow", () => {
  test("calls putDetourUpdate when the first waypoint is added", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(() => {
      expect(putDetourUpdate).toHaveBeenCalledTimes(1)
    })
  })

  test("calls putDetourUpdate multiple times when a waypoint is added and then the detour is finished", async () => {
    jest.mocked(putDetourUpdate).mockResolvedValue(Ok(12))

    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(() => {
      expect(putDetourUpdate).toHaveBeenCalledTimes(1)
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(putDetourUpdate).toHaveBeenCalledTimes(5)
    })
  })

  // We made an assumption that we'll never want to save detour edits in response to changing route/variant
  test("when finish button is clicked, does not call API to update the database", async () => {
    const route = routeFactory.build({ id: "66" })
    const routePatterns = routePatternFactory.buildList(2, {
      routeId: route.id,
    })
    const [rp1] = routePatterns

    render(
      <RoutesProvider routes={[route]}>
        <DiversionPage
          originalRoute={originalRouteFactory.build({
            routePattern: rp1,
            route,
          })}
        />
      </RoutesProvider>
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Change route or direction" })
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Start drawing detour" })
    )

    await waitFor(() => {
      expect(putDetourUpdate).toHaveBeenCalledTimes(0)
    })
  })

  // We made an assumption that we'll never want to save detour edits in response to changing route/variant
  test("when route is changed, does not call API to update the database", async () => {
    const routes = routeFactory.buildList(2)
    const [route1, route2] = routes

    render(
      <RoutesProvider routes={routes}>
        <DiversionPage
          originalRoute={originalRouteFactory.build({
            route: route1,
            routePattern: routePatternFactory.build({ routeId: route1.id }),
          })}
        />
      </RoutesProvider>
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Change route or direction" })
    )

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Choose route" }),
      route2.name
    )

    await waitFor(() => {
      expect(putDetourUpdate).toHaveBeenCalledTimes(0)
    })
  })
})
