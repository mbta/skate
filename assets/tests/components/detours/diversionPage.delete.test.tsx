import { beforeEach, describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DetourListPage } from "../../../src/components/detourListPage"
import {
  deleteDetour,
  fetchDetour,
  fetchDetours,
  putDetourUpdate,
} from "../../../src/api"
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
import { draftDetourFactory } from "../../factories/detourStateMachineFactory"

jest
  .useFakeTimers({ doNotFake: ["setTimeout"] })
  .setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/userTestGroups")

jest.mock("../../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())
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
    jest
      .mocked(fetchDetours)
      .mockResolvedValue(Ok(detourListFactoryWithDraft.build()))

    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Draft Detour 123"))
    expect(fetchDetour).toHaveBeenCalledWith(123)
  })

  test("renders detour details modal with delete draft button", async () => {
    jest
      .mocked(fetchDetours)
      .mockResolvedValue(Ok(detourListFactoryWithDraft.build()))
    jest.mocked(fetchDetour).mockResolvedValue(Ok(draftDetourFactory.build()))

    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Draft Detour 123"))

    expect(deleteDetourButton.get()).toBeVisible()
  })

  test("delete draft detour confirmation modal displays when Delete Draft button clicked", async () => {
    jest
      .mocked(fetchDetours)
      .mockResolvedValue(Ok(detourListFactoryWithDraft.build()))
    jest.mocked(fetchDetour).mockResolvedValue(Ok(draftDetourFactory.build()))

    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Draft Detour 123"))
    await userEvent.click(deleteDetourButton.get())

    expect(
      await screen.findByText("Are you sure you want to delete this draft?")
    ).toBeVisible()
  })

  test("Clicking the Delete Draft button on the Delete Draft Detour confirmation modal calls the deleteDetour api function", async () => {
    jest
      .mocked(fetchDetours)
      .mockResolvedValue(Ok(detourListFactoryWithDraft.build()))
    jest.mocked(fetchDetour).mockResolvedValue(Ok(draftDetourFactory.build()))

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
      .mocked(fetchDetours)
      .mockResolvedValue(Ok(detourListFactoryWithDraft.build()))
    jest.mocked(fetchDetour).mockResolvedValue(Ok(draftDetourFactory.build()))

    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Draft Detour 123"))
    await userEvent.click(deleteDetourButton.get())

    expect(
      await screen.findByText("Are you sure you want to delete this draft?")
    ).toBeVisible()

    await userEvent.click(cancelButton.get())

    expect(
      await screen.queryAllByText("Are you sure you want to delete this draft?")
    ).toStrictEqual([])
  })
})
