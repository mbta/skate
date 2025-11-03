import { beforeEach, describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DetourListPage } from "../../../src/components/detourListPage"
import { fetchDetour } from "../../../src/api"
import { Ok } from "../../../src/util/result"
import { mockScreenSize, neverPromise } from "../../testHelpers/mockHelpers"
import getTestGroups from "../../../src/userTestGroups"
import { detourListFactory } from "../../factories/detourListFactory"
import { TestGroups } from "../../../src/userInTestGroup"
import { detourInProgressFactory } from "../../factories/detourStateMachineFactory"
import { viewDraftDetourHeading } from "../../testHelpers/selectors/components/detours/diversionPage"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../../../src/hooks/useDetours"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import routeFactory from "../../factories/route"

jest
  .useFakeTimers({ doNotFake: ["setTimeout"] })
  .setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/userTestGroups")
jest.mock("../../../src/hooks/useDetours")
jest.mock("../../../src/api")

beforeEach(() => {
  const detourList = detourListFactory.build()
  jest.mocked(useActiveDetours).mockReturnValue(detourList.active)
  jest.mocked(useDraftDetours).mockReturnValue(detourList.draft)
  jest.mocked(usePastDetours).mockReturnValue(detourList.past)

  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
  jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])
})

describe("Detours Page: Open a Detour", () => {
  test("calls API with correct detour ID", async () => {
    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Headsign 1"))
    expect(fetchDetour).toHaveBeenCalledWith(1)
  })

  test("renders detour details modal to match mocked fetchDetour", async () => {
    const routes = routeFactory.buildList(2)
    // Return the state of the machine as the fetchDetour mocked value,
    // even if it doesn't match the detour clicked
    jest
      .mocked(fetchDetour)
      .mockResolvedValue(Ok(detourInProgressFactory.build()))

    const { baseElement } = render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    // Click an arbitrary detour from the list
    await userEvent.click(await screen.findByText("Headsign Z"))

    // Render modal based on mocked value, which is a detour-in-progress
    expect(viewDraftDetourHeading.get()).toBeVisible()

    // Finally, check snapshot
    await waitFor(() => expect(baseElement).toMatchSnapshot())
  })

  test("renders detour details in an open drawer on mobile", async () => {
    const routes = routeFactory.buildList(2)
    mockScreenSize("mobile")

    jest
      .mocked(fetchDetour)
      .mockResolvedValue(Ok(detourInProgressFactory.build()))

    const { baseElement } = render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    await userEvent.click(await screen.findByText("Headsign Z"))

    await waitFor(() => expect(baseElement).toMatchSnapshot())
  })

  test("detour details drawer is collapsible on mobile", async () => {
    mockScreenSize("mobile")

    jest
      .mocked(fetchDetour)
      .mockResolvedValue(Ok(detourInProgressFactory.build()))

    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Headsign Z"))
    await userEvent.click(await screen.findByTitle("Collapse"))
    expect(await screen.findByTitle("Expand")).toBeVisible()
  })
})
