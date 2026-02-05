import { beforeEach, describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DetourListPage } from "../../../src/components/detourListPage"
import {
  activateDetour,
  copyToDraftDetour,
  fetchDetour,
} from "../../../src/api"
import { Ok } from "../../../src/util/result"
import { neverPromise } from "../../testHelpers/mockHelpers"
import getTestGroups from "../../../src/userTestGroups"
import { detourListFactory } from "../../factories/detourListFactory"
import { TestGroups } from "../../../src/userInTestGroup"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../../../src/hooks/useDetours"
import { pastDetourFactory } from "../../factories/detourStateMachineFactory"
import { fullStoryEvent } from "../../../src/helpers/fullStory"

jest
  .useFakeTimers({ doNotFake: ["setTimeout"] })
  .setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/userTestGroups")
jest.mock("../../../src/hooks/useDetours")
jest.mock("../../../src/api")
jest.mock("../../../src/helpers/fullStory")

beforeEach(() => {
  const detourList = detourListFactory.build()
  jest.mocked(useActiveDetours).mockReturnValue(detourList.active)
  jest.mocked(useDraftDetours).mockReturnValue(detourList.draft)
  jest.mocked(usePastDetours).mockReturnValue(detourList.past)

  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
  jest.mocked(copyToDraftDetour).mockReturnValue(Promise.resolve(Ok(123)))
  jest
    .mocked(activateDetour)
    .mockResolvedValue(Ok({ activated_at: new Date() }))
})

describe("Detours Page: Copy To Draft", () => {
  test("calls API with correct detour ID", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    const pastDetour = pastDetourFactory.build()
    jest.mocked(fetchDetour).mockResolvedValue(Ok(pastDetour))
    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Headsign Z"))
    await screen.findByText("View Past Detour")
    await userEvent.click(await screen.findByText("Copy to new draft"))
    expect(copyToDraftDetour).toHaveBeenCalledWith(123)
    expect(mockedFSEvent).toHaveBeenCalledWith("Copy Past Detour to Draft", {})
  })
})
