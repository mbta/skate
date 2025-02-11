import React from "react"
import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { TestGroups } from "../../../src/userInTestGroup"
import getTestGroups from "../../../src/userTestGroups"
import userEvent from "@testing-library/user-event"
import { screen } from "@testing-library/dom"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { fetchDetours, fetchDetour, putDetourUpdate } from "../../../src/api"
import { DetourListPage } from "../../../src/components/detourListPage"
import { Ok } from "../../../src/util/result"
import { detourListFactory } from "../../factories/detourListFactory"
import {
  activeDetourFactory,
  detourInProgressFactory,
} from "../../factories/detourStateMachineFactory"
import { neverPromise } from "../../testHelpers/mockHelpers"
import { originalRouteFactory } from "../../factories/originalRouteFactory"
import {
  DiversionPage as DiversionPageDefault,
  DiversionPageProps,
} from "../../../src/components/detours/diversionPage"
import { byRole } from "testing-library-selector"

jest.mock("../../../src/api")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())
  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
  jest.mocked(putDetourUpdate).mockReturnValue(neverPromise())

  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
})

const DiversionPage = (props: Partial<DiversionPageProps>) => {
  return (
    <DiversionPageDefault
      originalRoute={originalRouteFactory.build()}
      onClose={() => null}
      {...props}
    />
  )
}

const threeHoursRadio = byRole("radio", { name: "3 hours" })
const cancelButton = byRole("button", { name: "Cancel" })
const doneButton = byRole("button", { name: "Done" })
const changeDurationButton = byRole("button", { name: "Change duration" })
const changeDurationHeading = byRole("heading", {
  name: "Change detour duration",
})

describe("DiversionPage edit duration workflow", () => {
  describe("before change duration modal", () => {
    test("does not have a change duration button if not an active detour", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(detourInProgressFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))

      expect(changeDurationButton.query()).not.toBeInTheDocument()
    })

    test("has a change duration button on the review details screen", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(activeDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))

      expect(changeDurationButton.get()).toBeVisible()
    })

    test("does not show change duration modal before clicking the button", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(activeDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))

      expect(changeDurationHeading.query()).not.toBeInTheDocument()
    })

    test("clicking change duration button shows the modal", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(Ok(activeDetourFactory.build()))

      render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))
      await userEvent.click(changeDurationButton.get())

      expect(changeDurationHeading.get()).toBeVisible()
    })
  })

  describe("from the change duration modal", () => {
    test("clicking a new duration changes the radio selection but not the previous duration", async () => {
      const { state } = activeDetourFactory.build()

      const result = render(<DiversionPage snapshot={state} />)

      await userEvent.click(changeDurationButton.get())

      expect(
        result.getByTestId("change-detour-duration-previous-time")
      ).toHaveTextContent(/2 hours/)
      await userEvent.click(threeHoursRadio.get())
      expect(threeHoursRadio.get()).toBeChecked()
      expect(
        result.getByTestId("change-detour-duration-previous-time")
      ).toHaveTextContent(/2 hours/)
    })

    test("changing duration and clicking cancel does not save the duration", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(
          Ok(
            activeDetourFactory.build(
              {},
              { transient: { duration: "2 hours" } }
            )
          )
        )

      const result = render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))
      await userEvent.click(changeDurationButton.get())

      await userEvent.click(threeHoursRadio.get())
      await userEvent.click(cancelButton.get())

      await userEvent.click(changeDurationButton.get())
      expect(
        result.getByTestId("change-detour-duration-previous-time")
      ).toHaveTextContent(/2 hours/)
    })

    test("changing the duration and clicking done saves the duration", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(
          Ok(
            activeDetourFactory.build(
              {},
              { transient: { duration: "2 hours" } }
            )
          )
        )

      const result = render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))
      await userEvent.click(changeDurationButton.get())

      await userEvent.click(threeHoursRadio.get())
      await userEvent.click(doneButton.get())

      await userEvent.click(changeDurationButton.get())
      expect(
        result.getByTestId("change-detour-duration-previous-time")
      ).toHaveTextContent(/3 hours/)
    })

    test("not changing duration and clicking done doesn't change the duration", async () => {
      jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
      jest
        .mocked(fetchDetour)
        .mockResolvedValue(
          Ok(
            activeDetourFactory.build(
              {},
              { transient: { duration: "2 hours" } }
            )
          )
        )

      const result = render(<DetourListPage />)

      await userEvent.click(await screen.findByText("Headsign A"))
      await userEvent.click(changeDurationButton.get())

      await userEvent.click(doneButton.get())

      await userEvent.click(changeDurationButton.get())
      expect(
        result.getByTestId("change-detour-duration-previous-time")
      ).toHaveTextContent(/2 hours/)
    })
  })
})
