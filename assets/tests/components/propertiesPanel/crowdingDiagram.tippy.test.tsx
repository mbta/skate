import { jest, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import CrowdingDiagram from "../../../src/components/propertiesPanel/crowdingDiagram"
import { Crowding } from "../../../src/models/crowding"
import crowdingFactory from "../../factories/crowdingFactory"
import { fullStoryEvent } from "../../../src/helpers/fullStory"

// Tippy sets some accessability attributes that is used for testing
// which means it's better to not mock Tippy
// Due to this unmock interacting badly with other tests
jest.unmock("@tippyjs/react")

jest.mock("../../../src/helpers/fullStory")

test("when info icon is clicked, should show tooltip", async () => {
  const mockedFSEvent = jest.mocked(fullStoryEvent)
  const crowded: Crowding = crowdingFactory.build()
  render(<CrowdingDiagram crowding={crowded} />)
  const ridersOnboardInfo = screen.getByRole("button", {
    name: /riders onboard/i,
  })

  await userEvent.click(ridersOnboardInfo)

  expect(ridersOnboardInfo).toHaveAccessibleDescription(
    "Riders are estimated using Automated Passenger Counters (APCs)."
  )
  expect(mockedFSEvent).toHaveBeenCalledWith(
    'User opened "Riders Onboard" tooltip'
  )
})
