import { beforeEach, describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DetourListPage } from "../../../src/components/detourListPage"
import { deleteDetour, fetchDetour, putDetourUpdate } from "../../../src/api"
import { Ok } from "../../../src/util/result"
import { neverPromise } from "../../testHelpers/mockHelpers"
import getTestGroups from "../../../src/userTestGroups"
import { detourListFactoryWithDraft } from "../../factories/detourListFactory"
import { TestGroups } from "../../../src/userInTestGroup"
import {
  cancelButton,
  confirmDeleteDetourButton,
  deleteDetourButton,
} from "../../testHelpers/selectors/components/detours/diversionPage"
import {
  finishedDraftDetourFactory,
  minimumDraftDetourFactory,
} from "../../factories/detourStateMachineFactory"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../../../src/hooks/useDetours"

jest
  .useFakeTimers({ doNotFake: ["setTimeout"] })
  .setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/userTestGroups")
jest.mock("../../../src/hooks/useDetours")
jest.mock("../../../src/api")

beforeEach(() => {
  const detours = detourListFactoryWithDraft.build()
  jest.mocked(useActiveDetours).mockReturnValue(detours.active)
  jest.mocked(useDraftDetours).mockReturnValue(detours.draft)
  jest.mocked(usePastDetours).mockReturnValue(detours.past)

  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
  jest.mocked(putDetourUpdate).mockReturnValue(neverPromise())
  jest.mocked(deleteDetour).mockReturnValue(neverPromise())
  jest
    .mocked(getTestGroups)
    .mockReturnValue([
      TestGroups.DetoursPilot,
      TestGroups.DetoursList,
      TestGroups.DeleteDraftDetours,
    ])
})

describe("Detours Page: Open a Detour", () => {
  test("calls API with correct detour ID", async () => {
    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Draft Detour 123"))
    expect(fetchDetour).toHaveBeenCalledWith(123)
  })

  describe("detour details modal for a minimum draft detour with a detour uuid", () => {
    test("renders detour details modal with delete draft button", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(minimumDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))

      expect(deleteDetourButton.get()).toBeVisible()
    })

    test("delete draft detour confirmation modal displays when Delete Draft button clicked", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(minimumDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))
      await userEvent.click(deleteDetourButton.get())

      expect(
        await screen.findByText("Are you sure you want to delete this draft?")
      ).toBeVisible()
    })

    test("Clicking the Delete Draft button on the Delete Draft Detour confirmation modal calls the deleteDetour api function", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(minimumDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))
      await userEvent.click(deleteDetourButton.get())

      expect(
        await screen.findByText("Are you sure you want to delete this draft?")
      ).toBeVisible()

      await userEvent.click(confirmDeleteDetourButton.get())

      expect(deleteDetour).toHaveBeenCalledWith(123)
    })

    test("Clicking the Cancel button on the Delete Draft Detour confirmation modal closes the modal", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(minimumDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))
      await userEvent.click(deleteDetourButton.get())

      expect(
        await screen.findByText("Are you sure you want to delete this draft?")
      ).toBeVisible()

      await userEvent.click(cancelButton.get())

      expect(
        screen.queryByText("Are you sure you want to delete this draft?")
      ).not.toBeInTheDocument()

      await userEvent.click(await screen.findByText("Draft Detour 123"))
    })
  })

  describe("detour details modal for a finished draft detour with a detour uuid", () => {
    test("renders detour details modal with delete draft button with a finished draft detour", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(finishedDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))

      expect(deleteDetourButton.get()).toBeVisible()
    })

    test("delete draft detour confirmation modal displays when Delete Draft button clicked on a finished draft detour", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(finishedDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))
      await userEvent.click(deleteDetourButton.get())

      expect(
        await screen.findByText("Are you sure you want to delete this draft?")
      ).toBeVisible()
    })

    test("Clicking the Delete Draft button on the Delete Draft Detour confirmation modal calls the deleteDetour api function", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(finishedDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))
      await userEvent.click(deleteDetourButton.get())

      expect(
        await screen.findByText("Are you sure you want to delete this draft?")
      ).toBeVisible()

      await userEvent.click(confirmDeleteDetourButton.get())

      expect(deleteDetour).toHaveBeenCalledWith(123)
    })

    test("Clicking the Cancel button on the Delete Draft Detour confirmation modal closes the modal", async () => {
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(finishedDraftDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Draft Detour 123"))
      await userEvent.click(deleteDetourButton.get())

      expect(
        await screen.findByText("Are you sure you want to delete this draft?")
      ).toBeVisible()

      await userEvent.click(cancelButton.get())

      expect(
        screen.queryByText("Are you sure you want to delete this draft?")
      ).not.toBeInTheDocument()
    })
  })
})
