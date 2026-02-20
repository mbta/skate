import React from "react"
import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { TestGroups } from "../../../src/userInTestGroup"
import getTestGroups from "../../../src/userTestGroups"
import userEvent from "@testing-library/user-event"
import { screen } from "@testing-library/dom"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { activateDetour, fetchDetour, putDetourUpdate } from "../../../src/api"
import { DetourListPage } from "../../../src/components/detourListPage"
import { Ok } from "../../../src/util/result"
import { detourListFactory } from "../../factories/detourListFactory"
import { activeDetourFactory } from "../../factories/detourStateMachineFactory"
import { neverPromise } from "../../testHelpers/mockHelpers"
import { byRole } from "testing-library-selector"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../../../src/hooks/useDetours"

jest.mock("../../../src/api")
jest.mock("../../../src/hooks/useDetours")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  const detours = detourListFactory.build()
  jest.mocked(useActiveDetours).mockReturnValue(detours.active)
  jest.mocked(useDraftDetours).mockReturnValue(detours.draft)
  jest.mocked(usePastDetours).mockReturnValue(detours.past)

  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
  jest.mocked(putDetourUpdate).mockResolvedValue(Ok(42))
  jest
    .mocked(activateDetour)
    .mockResolvedValue(Ok({ activated_at: new Date() }))

  jest
    .mocked(getTestGroups)
    .mockReturnValue([
      TestGroups.DetoursPilot,
      TestGroups.DetoursList,
      TestGroups.EditActiveDetours,
    ])
})

const undoButton = byRole("button", { name: "Undo" })
const discardModalHeading = byRole("heading", {
  name: "Discard unsaved changes?",
})
const confirmDiscardButton = byRole("button", { name: "Discard changes" })

const diversionPageOnActivateDetourScreen = async () => {
  jest.mocked(fetchDetour).mockResolvedValue(Ok(activeDetourFactory.build()))
  const { container } = render(<DetourListPage />)

  await userEvent.click(await screen.findByText("Headsign A"))
  await userEvent.click(byRole("button", { name: "Edit Route" }).get())
  return { container }
}

describe("Detours Page: Edit Active Detour", () => {
  test("clicking edit route button opens the edit screen", async () => {
    await diversionPageOnActivateDetourScreen()

    expect(
      byRole("heading", {
        name: "Edit Active Detour",
      }).get()
    ).toBeVisible()
    expect(byRole("button", { name: "Review Changes" }).get()).toBeDisabled()
  })

  test("clicking cancel shows discard changes warning before going to 'Active Detour' page", async () => {
    await diversionPageOnActivateDetourScreen()
    await userEvent.click(undoButton.get())

    await userEvent.click(byRole("button", { name: "Cancel" }).get())

    expect(discardModalHeading.get()).toBeVisible()

    await userEvent.click(confirmDiscardButton.get())

    expect(byRole("heading", { name: "Active Detour" }).get()).toBeVisible()
  })

  test("clicking Close shows discard changes warning before going to Detour List page", async () => {
    await diversionPageOnActivateDetourScreen()
    await userEvent.click(undoButton.get())

    await userEvent.click(byRole("button", { name: "Close" }).get())

    expect(discardModalHeading.get()).toBeVisible()

    await userEvent.click(confirmDiscardButton.get())

    expect(byRole("dialog").query()).toBeNull()
  })
})
