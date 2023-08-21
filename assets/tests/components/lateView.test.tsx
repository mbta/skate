import { jest, describe, test, expect, afterEach } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import { render, RenderResult } from "@testing-library/react"

import App from "../../src/components/app"
import LateView from "../../src/components/lateView"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../../src/contexts/vehiclesByRouteIdContext"
import {
  initialState,
  OpenView,
  State,
  selectVehicle,
  closeView,
} from "../../src/state"
import blockWaiverFactory from "../factories/blockWaiver"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import userEvent from "@testing-library/user-event"
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.spyOn(Date, "now").mockImplementation(() => {
  return 18000 * 1000
})

const state: State = { ...initialState, openView: OpenView.Late }
const lateMasterCheckboxTestId = "late-buses-master-checkbox"
const missingMasterCheckboxId = "missing-logons-master-checkbox"

const expectIndeterminateValue = (
  result: RenderResult,
  testId: string,
  value: boolean
): void =>
  expect(result.getByTestId(testId)).toHaveProperty("indeterminate", value)

const expectCheckedValue = (
  result: RenderResult,
  testId: string,
  value: boolean
): void => expect(result.getByTestId(testId)).toHaveProperty("checked", value)

describe("LateView", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  test("renders missing logons and late buses", () => {
    const vehiclesByRouteId = {
      route: [
        vehicleFactory.build({
          routeId: "route",
          runId: "run1",
          scheduleAdherenceSecs: 0,
        }),
        vehicleFactory.build({
          routeId: "route",
          runId: "run2",
          scheduleAdherenceSecs: 901,
        }),
        vehicleFactory.build({
          routeId: "other_route",
          runId: "run2",
          scheduleAdherenceSecs: 901,
        }),
        vehicleFactory.build({
          routeId: "route",
          runId: "run3",
          scheduleAdherenceSecs: 901,
          routeStatus: "laying_over",
        }),
        vehicleFactory.build({
          routeId: "route",
          runId: "run4",
          scheduleAdherenceSecs: 901,
          blockWaivers: [blockWaiverFactory.build()],
        }),
        ghostFactory.build({
          routeId: "route",
          runId: "run5",
          scheduledLogonTime: 15299,
          currentPieceFirstRoute: "route",
          currentPieceStartPlace: "garage",
        }),
        ghostFactory.build({
          routeId: "route",
          runId: "run6",
          scheduledLogonTime: 15301,
          currentPieceFirstRoute: "route",
          currentPieceStartPlace: "station",
        }),
        ghostFactory.build({
          routeId: "route",
          runId: "run7",
          scheduledLogonTime: 15302,
          currentPieceFirstRoute: "route",
          currentPieceStartPlace: "somewhere",
          blockWaivers: [blockWaiverFactory.build()],
        }),
      ],
    }

    const tree = renderer.create(
      <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
        <LateView />
      </VehiclesByRouteIdProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("clicking close button closes late view", async () => {
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{}}>
          <App />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(mockDispatch).toHaveBeenCalledWith(closeView())
  })

  test("clicking ghost run number opens ghost and sends tag manager event", async () => {
    mockFullStoryEvent()
    const ghost = ghostFactory.build({
      routeId: "route",
      runId: "12345",
      scheduledLogonTime: 15299,
      currentPieceFirstRoute: "route",
      currentPieceStartPlace: "garage",
    })

    const mockDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{ route: [ghost] }}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: /12345/ }))

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(ghost))

    expect(tagManagerEvent).toHaveBeenCalledWith(
      "selected_late_view_run_number_ghost"
    )
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User clicked Late View Run Number",
      { isGhost_bool: true }
    )
  })

  test("clicking vehicle run number opens vehicle and sends tag manager event", async () => {
    const vehicle = vehicleFactory.build({
      routeId: "route",
      runId: "12345",
      scheduleAdherenceSecs: 901,
    })

    const mockDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{ route: [vehicle] }}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: /12345/ }))

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))

    expect(tagManagerEvent).toHaveBeenCalledWith(
      "selected_late_view_run_number"
    )
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User clicked Late View Run Number",
      { isGhost_bool: false }
    )
  })

  test("clicking hide checkbox toggles row selection state", async () => {
    const lateVehicle = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateGhost = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost = ghostFactory.build({
      routeId: "route",
      runId: "run2",
      scheduledLogonTime: 15299,
    })

    const vehiclesByRouteId = {
      route: [lateVehicle, missingLogonGhost, lateGhost],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    const checkbox = result.getByTestId(`row-checkbox-${lateVehicle.runId}`)
    expect(checkbox).toHaveProperty("checked", false)

    await userEvent.click(checkbox)
    expect(checkbox).toHaveProperty("checked", true)

    await userEvent.click(checkbox)

    expect(checkbox).toHaveProperty("checked", false)
  })

  test("master checkbox state responds to individual checkbox states", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)

    // select 1/2 late vehicle - master checkbox is indeterminate
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    expectIndeterminateValue(result, lateMasterCheckboxTestId, true)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)

    // select second late vehicle - master checkbox is checked

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle2.runId}`)
    )

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)

    // missing logon master checkbox is unaffected

    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, false)

    // select 1 / 2 missing logon - master checkbox indeterminate

    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    expectIndeterminateValue(result, missingMasterCheckboxId, true),
      expectCheckedValue(result, missingMasterCheckboxId, false)

    // select second missing logon - master checkbox checked

    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost2.runId}`)
    )

    expectIndeterminateValue(result, missingMasterCheckboxId, false),
      expectCheckedValue(result, missingMasterCheckboxId, true)
  })

  test("master checkbox toggles multiple rows for late buses table", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // late vehicles start unchecked
    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, false)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, false)

    // click late vehicle master checkbox - both late vehicles are now checked

    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))
    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, true)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, true)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)

    // deselect 1 late vehicle - master checkbox now indeterminate

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, false)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, true)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, true)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)

    // select the late vehicle master checkbox

    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)

    // deselect the late vehicle master checkbox
    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))

    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, false)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, false)
    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)
  })

  test("master checkbox toggles multiple rows for missing logons table", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // missing logons start unchecked
    expectCheckedValue(
      result,
      `row-checkbox-${missingLogonGhost1.runId}`,
      false
    )
    expectCheckedValue(
      result,
      `row-checkbox-${missingLogonGhost2.runId}`,
      false
    )

    // select missing logon master checkbox - both are checked
    await userEvent.click(result.getByTestId(missingMasterCheckboxId))
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost1.runId}`, true)
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost2.runId}`, true)

    // deselect one - master checkbox now indeterminate
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )

    expectCheckedValue(
      result,
      `row-checkbox-${missingLogonGhost1.runId}`,
      false
    )
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost2.runId}`, true)

    expectIndeterminateValue(result, missingMasterCheckboxId, true)
    expectCheckedValue(result, missingMasterCheckboxId, false)

    // select master checkbox - now checked

    await userEvent.click(result.getByTestId(missingMasterCheckboxId))

    expectCheckedValue(result, `row-checkbox-${missingLogonGhost1.runId}`, true)
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost2.runId}`, true)
    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, true)

    // deselect master checkbox - no rows checked
    await userEvent.click(result.getByTestId(missingMasterCheckboxId))

    expectCheckedValue(
      result,
      `row-checkbox-${missingLogonGhost1.runId}`,
      false
    )
    expectCheckedValue(
      result,
      `row-checkbox-${missingLogonGhost2.runId}`,
      false
    )
  })

  test("master checkbox state doesn't count hidden rows", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle3 = vehicleFactory.build({
      routeId: "route",
      runId: "run3",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run5",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost3 = ghostFactory.build({
      routeId: "route",
      runId: "run6",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        lateVehicle3,
        missingLogonGhost1,
        missingLogonGhost2,
        missingLogonGhost3,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // hide 2 rows / 6 total - 1 missing logon, 1 late vehicle
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )

    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(4)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)
    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, false)

    // re-include the 2 hidden rows
    await userEvent.click(result.getAllByTitle("Include Hidden")[0])

    // those hidden rows are present, but don't have check boxes
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(4)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(6)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)
    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, false)

    // selecting one master checkbox shows 2 have been selected to hide
    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))
    expect(result.getByText("2 selected")).toBeTruthy()
    // deselect master checkbox
    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))

    // select 2 more rows - 1 late, 1 missing logon. (2/3 late, 2/3 missing have been selected)
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle2.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost2.runId}`)
    )

    expectIndeterminateValue(result, lateMasterCheckboxTestId, true)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)
    expectIndeterminateValue(result, missingMasterCheckboxId, true)
    expectCheckedValue(result, missingMasterCheckboxId, false)

    // select last 2 unselected rows
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost3.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle3.runId}`)
    )

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)
    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, true)
  })

  test("select rows and clicking hide button hides rows", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    // hide 2 / 4 rows - 1 missing logon, 1 late vehicle
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(
      result.queryByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    ).toBeNull()
    expect(
      result.queryByTestId(`row-checkbox-${lateVehicle1.runId}`)
    ).toBeNull()

    // still 2 unchecked boxes remaining
    const remainingCheckboxes = result.getAllByTestId(/row-checkbox/)
    expect(remainingCheckboxes).toHaveLength(2)
    remainingCheckboxes.map((r) => expect(r).toHaveProperty("checked", false))
  })

  test("can undo hiding, but only for a limited time", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // hide 2/4 rows - 1 missing logon, 1 late vehicle
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)

    // undo hiding - all 4 rows still have checkboxes
    await userEvent.click(result.getByRole("button", { name: /Undo/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(4)
  })

  test("eye toggle toggles visibility of non-permanently-hidden rows", async () => {
    mockFullStoryEvent()
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // if no rows have been hidden, no button to include/exclude hidden
    expect(result.queryByTitle("Include Hidden")).toBeNull()
    expect(result.queryByTitle("Exclude Hidden")).toBeNull()
    // hide 2/4 rows - 1 missing logon, 1 late vehicle
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    // button to include hidden rows is present on both tables
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)
    expect(result.getAllByTitle("Include Hidden")).toHaveLength(2)
    expect(result.queryAllByTitle("Exclude Hidden")).toHaveLength(0)

    // include the hidden rows for both tables by clicking 1 of the buttons
    await userEvent.click(result.getAllByTitle("Include Hidden")[0])

    // hidden rows are visible, but don't have checkboxes
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(4)

    // click button to re-hide previously hidden rows
    expect(result.queryAllByTitle("Include Hidden")).toHaveLength(0)
    expect(result.getAllByTitle("Exclude Hidden")).toHaveLength(2)

    await userEvent.click(result.getAllByTitle("Exclude Hidden")[0])

    // option to include hidden re-appears, the 2 remaining rows are still visible
    expect(result.getAllByTitle("Include Hidden")).toHaveLength(2)
    expect(result.queryAllByTitle("Exclude Hidden")).toHaveLength(0)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(2)
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)

    expect(tagManagerEvent).toHaveBeenCalledWith("clicked_eye_toggle")
    expect(window.FS!.event).toHaveBeenCalledWith(
      'User clicked the "hide" eye toggle'
    )
  })

  test("persist hidden rows between page loads", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })
    const missingLogonGhost1 = ghostFactory.build({
      routeId: "route",
      runId: "run3",
      scheduledLogonTime: 15301,
    })
    const missingLogonGhost2 = ghostFactory.build({
      routeId: "route",
      runId: "run4",
      scheduledLogonTime: 15301,
    })

    const vehiclesByRouteId = {
      route: [
        lateVehicle1,
        lateVehicle2,
        missingLogonGhost1,
        missingLogonGhost2,
      ],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // hide 2/4 rows
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    // only 2 remaining rows visible and are unchecked
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)

    result
      .getAllByTestId(/row-checkbox/)
      .map((checkbox) => expect(checkbox).toHaveProperty("checked", false))

    // only 2 rows still visible after re-render
    result.rerender(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)
    result
      .getAllByTestId(/row-checkbox/)
      .map((r) => expect(r).toHaveProperty("checked", false))
  })

  test("if viewing hidden rows, and we hide a row, turn off eye toggle", async () => {
    const lateVehicle1 = vehicleFactory.build({
      routeId: "route",
      runId: "run1",
      scheduleAdherenceSecs: 901,
    })
    const lateVehicle2 = vehicleFactory.build({
      routeId: "route",
      runId: "run2",
      scheduleAdherenceSecs: 901,
    })

    const vehiclesByRouteId = {
      route: [lateVehicle1, lateVehicle2],
    }

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    // hide 1/2 rows
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))
    // re-include hidden row
    await userEvent.click(result.getAllByTitle("Include Hidden")[0])

    // button to exclude hidden visible, 2 rows are present
    expect(result.getAllByTitle("Exclude Hidden")).toHaveLength(2)
    expect(result.queryAllByTitle("Include Hidden")).toHaveLength(0)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(2)

    // hide 2nd row
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle2.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    // no more rows visible
    expect(result.queryAllByTestId(/row-checkbox/)).toHaveLength(0)
    expect(result.queryAllByTitle("Exclude Hidden")).toHaveLength(0)
    // button to re-include hidden rows visible on both tables
    expect(result.getAllByTitle("Include Hidden")).toHaveLength(2)
  })
})
