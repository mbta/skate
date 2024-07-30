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
import { act, fireEvent, render } from "@testing-library/react"
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
} from "../../../src/api"
import { neverPromise } from "../../testHelpers/mockHelpers"

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

const DiversionPage = (props: Partial<DiversionPageProps>) => {
  return (
    <DiversionPageDefault
      originalRoute={originalRouteFactory.build()}
      showConfirmCloseModal={false}
      {...props}
    />
  )
}

jest.mock("../../../src/api")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockReturnValue(neverPromise())
  jest.mocked(fetchUnfinishedDetour).mockReturnValue(neverPromise())
  jest.mocked(fetchFinishedDetour).mockReturnValue(neverPromise())
  jest.mocked(fetchNearestIntersection).mockReturnValue(neverPromise())
  jest.mocked(fetchRoutePatterns).mockReturnValue(neverPromise())

  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
})

describe("DiversionPage activate workflow", () => {
  test("does not have an activate button on the review details screen if not in the detours-list test group", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    await userEvent.click(reviewDetourButton.get())

    expect(activateDetourButton.query()).not.toBeInTheDocument()
  })

  test("has an activate button on the review details screen", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    await userEvent.click(reviewDetourButton.get())

    expect(activateDetourButton.get()).toBeVisible()
  })
})
