import React, { act } from "react"
import {
  DiversionPage as DiversionPageDefault,
  DiversionPageProps,
} from "../../../src/components/detours/diversionPage"
import { originalRouteFactory } from "../../factories/originalRouteFactory"
import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { fireEvent, render, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  activateDetourButton,
  originalRouteShape,
  reviewDetourButton,
} from "../../testHelpers/selectors/components/detours/diversionPage"
import {
  activateDetour,
  fetchDetourDirections,
  fetchFinishedDetour,
  fetchNearestIntersection,
  fetchRoutePatterns,
  fetchUnfinishedDetour,
  putDetourUpdate,
} from "../../../src/api"
import { neverPromise } from "../../testHelpers/mockHelpers"
import { byRole } from "testing-library-selector"
import { Ok } from "../../../src/util/result"

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
  jest.mocked(putDetourUpdate).mockResolvedValue(Ok(42))
  jest
    .mocked(activateDetour)
    .mockResolvedValue(Ok({ activated_at: new Date() }))

  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
})

const diversionPageOnActiveDetourScreen = async (
  props?: Partial<DiversionPageProps>
) => {
  const { container } = render(<DiversionPage {...props} />)
  const user = userEvent.setup({ delay: 100 })

  act(() => {
    fireEvent.click(originalRouteShape.get(container))
  })
  act(() => {
    fireEvent.click(originalRouteShape.get(container))
  })
  await user.click(reviewDetourButton.get())
  await user.click(activateDetourButton.get())
  await user.click(threeHoursRadio.get())
  await user.click(nextButton.get())
  await user.click(constructionRadio.get())
  await user.click(nextButton.get())
  await user.click(activateButton.get())

  // Wait for the async server-side activation to complete
  await waitFor(() => expect(activeDetourHeading.get()).toBeVisible())

  return { container, user }
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
    const { user } = await diversionPageOnActiveDetourScreen()

    await user.click(regularRouteButton.get())
    expect(activeDetourHeading.get()).toBeVisible()

    expect(pastDetourHeading.query()).not.toBeInTheDocument()
  })

  test("clicking the 'Return to regular route' button opens the deactivate modal", async () => {
    const { user } = await diversionPageOnActiveDetourScreen()

    await user.click(regularRouteButton.get())
    expect(returnModalHeading.get()).toBeVisible()
  })

  test("clicking the 'Return to regular route' button from the the deactivate modal deactivates the detour", async () => {
    const { user } = await diversionPageOnActiveDetourScreen()

    await user.click(regularRouteButton.get())

    // We need to query this button in a different way from other
    // buttons because it's not the only button with the label "Return
    // to regular route" on the page, so we need to deterministically
    // ensure that we're querying the right one.
    const modal = returnModalHeading.get().parentElement
      ?.parentElement as HTMLElement
    const confirmButton = within(modal!).getByRole("button", {
      name: "Return to regular route",
    })
    await user.click(confirmButton)

    expect(activeDetourHeading.query()).not.toBeInTheDocument()
    expect(pastDetourHeading.get()).toBeVisible()
  })

  test("clicking the 'Cancel' button from the the deactivate modal closes the modal", async () => {
    const { user } = await diversionPageOnActiveDetourScreen()

    await user.click(regularRouteButton.get())
    await user.click(cancelButton.get())

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
