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
import { byRole } from "testing-library-selector"

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

const DiversionPage = (props: Partial<DiversionPageProps>) => (
  <DiversionPageDefault
    originalRoute={originalRouteFactory.build()}
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

const diversionPageOnSelectDurationModalScreen = async (
  props?: Partial<DiversionPageProps>
) => {
  const { container } = await diversionPageOnReviewScreen(props)

  await userEvent.click(activateDetourButton.get())

  return { container }
}

const diversionPageOnSelectReasonModalScreen = async (
  props?: Partial<DiversionPageProps>
) => {
  const { container } = await diversionPageOnSelectDurationModalScreen(props)

  await userEvent.click(threeHoursRadio.get())
  await userEvent.click(nextButton.get())

  return { container }
}

const diversionPageOnConfirmModalScreen = async (
  props?: Partial<DiversionPageProps>
) => {
  const { container } = await diversionPageOnSelectReasonModalScreen(props)

  await userEvent.click(constructionRadio.get())
  await userEvent.click(nextButton.get())

  return { container }
}

const diversionPageOnActiveDetourScreen = async (
  props?: Partial<DiversionPageProps>
) => {
  const { container } = await diversionPageOnConfirmModalScreen(props)

  await userEvent.click(activateButton.get())

  return { container }
}

const step1Heading = byRole("heading", {
  name: "Step 1 of 3 - Select detour duration",
})
const step2Heading = byRole("heading", {
  name: "Step 2 of 3 - Select reason for detour",
})
const step3Heading = byRole("heading", {
  name: "Step 3 of 3 - Activate detour",
})

const backButton = byRole("button", { name: "Back" })
const cancelButton = byRole("button", { name: "Cancel" })
const nextButton = byRole("button", { name: "Next" })
const activateButton = byRole("button", { name: "Activate detour" })

const threeHoursRadio = byRole("radio", { name: "3 hours" })
const oneHourRadio = byRole("radio", { name: "1 hour" })

const constructionRadio = byRole("radio", { name: "Construction" })
const paradeRadio = byRole("radio", { name: "Parade" })

describe("DiversionPage activate workflow", () => {
  describe("from before the activate modal", () => {
    test("does not have an activate button on the review details screen if not in the detours-list test group", async () => {
      jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

      await diversionPageOnReviewScreen()

      expect(activateDetourButton.query()).not.toBeInTheDocument()
    })

    test("has an activate button on the review details screen", async () => {
      await diversionPageOnReviewScreen()

      expect(activateDetourButton.get()).toBeVisible()
    })

    test("does not show the activate flow modal before clicking the activate button", async () => {
      await diversionPageOnReviewScreen()

      expect(
        screen.getByRole("heading", { name: "Share Detour Details" })
      ).toBeVisible()
      expect(step1Heading.query()).not.toBeInTheDocument()
    })

    test("clicking the activate button shows the first screen of the activate flow modal", async () => {
      await diversionPageOnReviewScreen()

      await userEvent.click(activateDetourButton.get())

      expect(
        screen.getByRole("heading", { name: "Share Detour Details" })
      ).toBeVisible()
      expect(step1Heading.get()).toBeVisible()
    })
  })

  describe("from the duration-selection screen on the activate modal", () => {
    test("buttons start out in the right states on the activate flow modal", async () => {
      await diversionPageOnSelectDurationModalScreen()

      expect(cancelButton.get()).toBeEnabled()
      expect(nextButton.get()).toBeDisabled()

      expect(backButton.query()).not.toBeInTheDocument()
      expect(activateButton.query()).not.toBeInTheDocument()
    })

    test("the 'Cancel' button closes the modal", async () => {
      await diversionPageOnSelectDurationModalScreen()

      await userEvent.click(cancelButton.get())

      expect(step1Heading.query()).not.toBeInTheDocument()
    })

    test("selecting a duration selects that radio button", async () => {
      await diversionPageOnSelectDurationModalScreen()

      await userEvent.click(threeHoursRadio.get())

      expect(threeHoursRadio.get()).toBeChecked()
    })

    test("selecting a duration de-selects the previously-selected duration button", async () => {
      await diversionPageOnSelectDurationModalScreen()
      await userEvent.click(threeHoursRadio.get())

      await userEvent.click(oneHourRadio.get())

      expect(oneHourRadio.get()).toBeChecked()
      expect(threeHoursRadio.get()).not.toBeChecked()
    })

    test("selecting a duration enables the 'Next' button", async () => {
      await diversionPageOnSelectDurationModalScreen()

      await userEvent.click(threeHoursRadio.get())

      expect(nextButton.get()).toBeEnabled()
    })

    test("the 'Next' button advances to the next screen", async () => {
      await diversionPageOnSelectDurationModalScreen()

      await userEvent.click(threeHoursRadio.get())

      await userEvent.click(nextButton.get())

      expect(step1Heading.query()).not.toBeInTheDocument()
      expect(step2Heading.get()).toBeVisible()
    })

    test("re-opening the modal after selecting an option keeps that option selected", async () => {
      await diversionPageOnSelectDurationModalScreen()

      await userEvent.click(threeHoursRadio.get())
      await userEvent.click(cancelButton.get())

      await userEvent.click(activateDetourButton.get())

      expect(step1Heading.query()).toBeVisible()
      expect(threeHoursRadio.get()).toBeChecked()
      expect(nextButton.get()).toBeEnabled()
    })
  })

  describe("from the reason-selection screen on the activate modal", () => {
    test("buttons start out in the right states on the activate flow modal", async () => {
      await diversionPageOnSelectReasonModalScreen()

      expect(cancelButton.get()).toBeEnabled()
      expect(nextButton.get()).toBeDisabled()
      expect(backButton.get()).toBeEnabled()
    })

    test("the 'Cancel' button closes the modal", async () => {
      await diversionPageOnSelectReasonModalScreen()

      await userEvent.click(cancelButton.get())

      expect(step1Heading.query()).not.toBeInTheDocument()
      expect(step2Heading.query()).not.toBeInTheDocument()
    })

    test("the 'Back' button returns to the first screen with the 'Next' button enabled", async () => {
      await diversionPageOnSelectReasonModalScreen()

      await userEvent.click(backButton.get())

      expect(step2Heading.query()).not.toBeInTheDocument()
      expect(step1Heading.get()).toBeVisible()

      expect(nextButton.get()).toBeEnabled()
    })

    test("selecting a reason selects that radio button", async () => {
      await diversionPageOnSelectReasonModalScreen()

      await userEvent.click(constructionRadio.get())

      expect(constructionRadio.get()).toBeChecked()
    })

    test("selecting a reason de-selects the previously-selected reason button", async () => {
      await diversionPageOnSelectReasonModalScreen()
      await userEvent.click(constructionRadio.get())

      await userEvent.click(paradeRadio.get())

      expect(paradeRadio.get()).toBeChecked()
      expect(constructionRadio.get()).not.toBeChecked()
    })

    test("selecting a reason enables the 'Next' button", async () => {
      await diversionPageOnSelectReasonModalScreen()

      await userEvent.click(constructionRadio.get())

      expect(nextButton.get()).toBeEnabled()
    })

    test("the 'Next' button advances to the next screen", async () => {
      await diversionPageOnSelectReasonModalScreen()

      await userEvent.click(constructionRadio.get())

      await userEvent.click(nextButton.get())

      expect(step1Heading.query()).not.toBeInTheDocument()
      expect(step2Heading.query()).not.toBeInTheDocument()
      expect(step3Heading.get()).toBeVisible()
    })

    test("returning to this screen after hitting the 'Back' button leaves the option selected", async () => {
      await diversionPageOnSelectReasonModalScreen()

      await userEvent.click(paradeRadio.get())
      await userEvent.click(backButton.get())
      await userEvent.click(nextButton.get())

      expect(step2Heading.get()).toBeVisible()

      expect(paradeRadio.get()).toBeChecked()
      expect(nextButton.get()).toBeEnabled()
    })
  })

  describe("from the confirmation screen on the activate modal", () => {
    test("buttons start out in the right states", async () => {
      await diversionPageOnConfirmModalScreen()

      expect(cancelButton.get()).toBeEnabled()
      expect(backButton.get()).toBeEnabled()
      expect(activateButton.get()).toBeEnabled()

      expect(nextButton.query()).not.toBeInTheDocument()
    })

    test("the 'Cancel' button closes the modal", async () => {
      await diversionPageOnConfirmModalScreen()

      await userEvent.click(cancelButton.get())

      expect(step1Heading.query()).not.toBeInTheDocument()
      expect(step2Heading.query()).not.toBeInTheDocument()
      expect(step3Heading.query()).not.toBeInTheDocument()
    })

    test("the 'Back' button returns to the second screen", async () => {
      await diversionPageOnConfirmModalScreen()

      await userEvent.click(backButton.get())

      expect(step3Heading.query()).not.toBeInTheDocument()
      expect(step2Heading.get()).toBeVisible()
    })

    test("the 'Activate' button shows the 'Active Detour' screen", async () => {
      await diversionPageOnConfirmModalScreen()

      await userEvent.click(activateButton.get())

      expect(
        screen.queryByRole("heading", { name: "Share Detour Details" })
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole("heading", { name: "Active Detour" })
      ).toBeVisible()
    })
  })

  describe("from the 'Active Detour' screen", () => {
    test("'Active Detour' screen has a 'Return to regular route' button", async () => {
      await diversionPageOnActiveDetourScreen()

      expect(
        screen.getByRole("button", { name: "Return to regular route" })
      ).toBeVisible()
    })
  })
})
