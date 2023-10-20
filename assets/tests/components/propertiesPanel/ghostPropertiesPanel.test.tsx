import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import GhostPropertiesPanel from "../../../src/components/propertiesPanel/ghostPropertiesPanel"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import { BlockWaiver, Ghost } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as dateTime from "../../../src/util/dateTime"
import ghostFactory from "../../factories/ghost"
import routeFactory from "../../factories/route"

import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../../src/hooks/useMinischedule"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TabMode } from "../../../src/components/propertiesPanel/tabPanels"
import { closeButton } from "../../testHelpers/selectors/components/closeButton"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("1970-01-01T22:42:00.000Z"))

jest.mock("../../../src/hooks/useMinischedule")

const ghost: Ghost = ghostFactory.build({
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: "123-0123",
  viaVariant: "X",
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  scheduledLogonTime: null,
  routeStatus: "on_route",
  blockWaivers: [],
})

const route: Route = routeFactory.build({
  id: "39",
  name: "39",
})

describe("GhostPropertiesPanel", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <RoutesProvider routes={[route]}>
          <GhostPropertiesPanel
            selectedGhost={ghost}
            tabMode="status"
            setTabMode={jest.fn()}
            closePanel={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost with missing run", () => {
    const ghostWithoutRun: Ghost = { ...ghost, runId: null }
    const tree = renderer
      .create(
        <RoutesProvider routes={[route]}>
          <GhostPropertiesPanel
            selectedGhost={ghostWithoutRun}
            tabMode="status"
            setTabMode={jest.fn()}
            closePanel={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost with block waivers", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("1970-01-01T05:05:00.000Z"),
      endTime: new Date("1970-01-01T12:38:00.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const ghostWithBlockWaivers: Ghost = {
      ...ghost,
      blockWaivers: [blockWaiver],
    }

    const tree = renderer
      .create(
        <GhostPropertiesPanel
          selectedGhost={ghostWithBlockWaivers}
          tabMode="status"
          setTabMode={jest.fn()}
          closePanel={jest.fn()}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("calls closePanel callback on close", async () => {
    const mockClosePanel = jest.fn()

    render(
      <GhostPropertiesPanel
        selectedGhost={ghost}
        tabMode="status"
        setTabMode={jest.fn()}
        closePanel={mockClosePanel}
      />
    )

    await userEvent.click(closeButton.get())

    expect(mockClosePanel).toHaveBeenCalled()
  })

  test.each<{ tab: TabMode; clickTarget: string; initialTab?: TabMode }>([
    { tab: "run", clickTarget: "Run" },
    { tab: "block", clickTarget: "Block" },
    { tab: "status", clickTarget: "Status", initialTab: "block" },
  ])(
    "when active tab changes to '$tab', calls tab change callback",
    async ({ tab, clickTarget, initialTab }) => {
      jest.mocked(useMinischeduleRun).mockReturnValue(undefined)
      jest.mocked(useMinischeduleBlock).mockReturnValue(undefined)

      const mockSetTabMode = jest.fn()

      render(
        <GhostPropertiesPanel
          selectedGhost={ghostFactory.build()}
          tabMode={initialTab || "status"}
          setTabMode={mockSetTabMode}
          closePanel={jest.fn()}
        />
      )

      await userEvent.click(screen.getByRole("tab", { name: clickTarget }))

      expect(mockSetTabMode).toHaveBeenCalledWith(tab)
    }
  )
})
