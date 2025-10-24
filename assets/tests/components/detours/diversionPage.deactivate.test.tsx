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
import { act, fireEvent, render, within } from "@testing-library/react"
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
import { byRole } from "testing-library-selector"

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

const DiversionPage = (props: Partial<DiversionPageProps>) => (
  <DiversionPageDefault
    originalRoute={originalRouteFactory.build()}
    onClose={() => null}
    onOpenDetour={() => null}
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

const diversionPageOnActiveDetourScreen = async (
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
  await userEvent.click(activateDetourButton.get())
  await userEvent.click(threeHoursRadio.get())
  await userEvent.click(nextButton.get())
  await userEvent.click(constructionRadio.get())
  await userEvent.click(nextButton.get())
  await userEvent.click(activateButton.get())

  return { container }
}

const nextButton = byRole("button", { name: "Next" })
const activateButton = byRole("button", { name: "Activate detour" })
const threeHoursRadio = byRole("radio", { name: "3 hours" })
const constructionRadio = byRole("radio", { name: "Construction" })

const activeDetourHeading = byRole("heading", { name: "Active Detour" })
const pastDetourHeading = byRole("heading", { name: "View Past Detour" })
const returnModalHeading = byRole("heading", {
  name: "Return to regular route?",
})

const regularRouteButton = byRole("button", { name: "Return to regular route" })
const cancelButton = byRole("button", { name: "Cancel" })

describe("DiversionPage deactivate workflow", () => {
  test("clicking the 'Return to regular route' button keeps existing headers on the screen", async () => {
    await diversionPageOnActiveDetourScreen()

    await userEvent.click(regularRouteButton.get())
    expect(activeDetourHeading.get()).toBeVisible()

    expect(pastDetourHeading.query()).not.toBeInTheDocument()
  })

  test("clicking the 'Return to regular route' button opens the deactivate modal", async () => {
    await diversionPageOnActiveDetourScreen()

    await userEvent.click(regularRouteButton.get())
    expect(returnModalHeading.get()).toBeVisible()
  })

  test("clicking the 'Return to regular route' button from the the deactivate modal deactivates the detour", async () => {
    await diversionPageOnActiveDetourScreen()

    await userEvent.click(regularRouteButton.get())

    // We need to query this button in a different way from other
    // buttons because it's not the only button with the label "Return
    // to regular route" on the page, so we need to deterministically
    // ensure that we're querying the right one.
    const modal = returnModalHeading.get().parentElement
      ?.parentElement as HTMLElement
    const confirmButton = within(modal!).getByRole("button", {
      name: "Return to regular route",
    })
    await userEvent.click(confirmButton)

    expect(activeDetourHeading.query()).not.toBeInTheDocument()
    expect(pastDetourHeading.get()).toBeVisible()
  })

  test("clicking the 'Cancel' button from the the deactivate modal closes the modal", async () => {
    await diversionPageOnActiveDetourScreen()

    await userEvent.click(regularRouteButton.get())
    await userEvent.click(cancelButton.get())

    expect(activeDetourHeading.get()).toBeVisible()
    expect(pastDetourHeading.query()).not.toBeInTheDocument()

    expect(returnModalHeading.query()).not.toBeInTheDocument()
  })

  test("does not have a 'Return to regular route' button for users who are not dispatchers", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])

    await diversionPageOnActiveDetourScreen()

    expect(regularRouteButton.query()).not.toBeInTheDocument()
  })
})
