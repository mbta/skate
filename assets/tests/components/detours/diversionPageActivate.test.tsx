import React from "react"
import {
  DiversionPage as DiversionPageDefault,
  DiversionPageProps,
} from "../../../src/components/detours/diversionPage"
import { originalRouteFactory } from "../../factories/originalRouteFactory"
import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  activateDetourButton,
  originalRouteShape,
  reviewDetourButton,
} from "../../testHelpers/selectors/components/detours/diversionPage"
import {
  fetchDetourDirections,
  fetchFinishedDetour,
  fetchNearestIntersection,
  fetchRoutePatterns,
  fetchUnfinishedDetour,
  putDetourUpdate,
} from "../../../src/api"
import { neverPromise } from "../../testHelpers/mockHelpers"

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

const DiversionPage = (props: Partial<DiversionPageProps>) => (
  <DiversionPageDefault
    originalRoute={originalRouteFactory.build()}
    showConfirmCloseModal={false}
    onConfirmClose={() => null}
    {...props}
  />
)

jest.mock("../../../src/api")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockReturnValue(neverPromise())
  jest.mocked(fetchUnfinishedDetour).mockReturnValue(neverPromise())
  jest.mocked(fetchFinishedDetour).mockReturnValue(neverPromise())
  jest.mocked(fetchNearestIntersection).mockReturnValue(neverPromise())
  jest.mocked(fetchRoutePatterns).mockReturnValue(neverPromise())
  jest.mocked(putDetourUpdate).mockReturnValue(neverPromise())

  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
})

const diversionPageOnReviewScreen = async (
  props?: Partial<DiversionPageProps>
) => {
  const { container } = render(<DiversionPage {...props} />)

  act(() => {
    fireEvent.click(originalRouteShape.get(container))
  })
  act(() => {
    fireEvent.click(originalRouteShape.get(container))
  })
  await userEvent.click(reviewDetourButton.get())

  return { container }
}

describe("DiversionPage activate workflow", () => {
  test("does not have an activate button on the review details screen if not in the detours-list test group", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

    await diversionPageOnReviewScreen()

    expect(activateDetourButton.query()).not.toBeInTheDocument()
  })

  test("has an activate button on the review details screen", async () => {
    await diversionPageOnReviewScreen()

    expect(activateDetourButton.get()).toBeVisible()
  })

  test("clicking the activate button shows the 'Active Detour' screen", async () => {
    await diversionPageOnReviewScreen()

    await userEvent.click(activateDetourButton.get())

    expect(
      screen.queryByRole("heading", { name: "Share Detour Details" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Active Detour" })).toBeVisible()
  })

  test("'Active Detour' screen has a 'Deactivate Detour' button", async () => {
    await diversionPageOnReviewScreen()

    await userEvent.click(activateDetourButton.get())

    expect(
      screen.getByRole("button", { name: "Deactivate Detour" })
    ).toBeVisible()
  })

  test("clicking the 'Deactivate Detour' button shows the 'Past Detour' screen", async () => {
    await diversionPageOnReviewScreen()

    await userEvent.click(activateDetourButton.get())

    await userEvent.click(
      screen.getByRole("button", { name: "Deactivate Detour" })
    )
    expect(
      screen.queryByRole("heading", { name: "Active Detour" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Past Detour" })).toBeVisible()
  })
})
