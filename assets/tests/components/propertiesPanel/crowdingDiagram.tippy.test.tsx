import { jest, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import CrowdingDiagram from "../../../src/components/propertiesPanel/crowdingDiagram"
import { Crowding } from "../../../src/models/crowding"
import crowdingFactory from "../../factories/crowdingFactory"
import * as FullStory from "@fullstory/browser"

// Tippy sets some accessability attributes that is used for testing
// which means it's better to not mock Tippy
// Due to this unmock interacting badly with other tests
jest.unmock("@tippyjs/react")

jest.mock("@fullstory/browser")

test("when info icon is clicked, should show tooltip", async () => {
  const mockedFS = jest.mocked(FullStory)
  const crowded: Crowding = crowdingFactory.build()
  render(<CrowdingDiagram crowding={crowded} />)
  const ridersOnboardInfo = screen.getByRole("button", {
    name: /riders onboard/i,
  })

  await userEvent.click(ridersOnboardInfo)

  expect(ridersOnboardInfo).toHaveAccessibleDescription(
    "Riders are estimated using Automated Passenger Counters (APCs)."
  )
  expect(mockedFS.event).toHaveBeenCalledWith(
    'User opened "Riders Onboard" tooltip',
    {}
  )
})
