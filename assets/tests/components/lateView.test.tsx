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
  closeLateView,
} from "../../src/state"
import blockWaiverFactory from "../factories/blockWaiver"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import userEvent from "@testing-library/user-event"

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

    await user.click(result.getByTitle("Close"))

    expect(mockDispatch).toHaveBeenCalledWith(closeLateView())
  })

  test("clicking ghost run number opens ghost and sends Fullstory event", async () => {
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
  })

  test("clicking vehicle run number opens vehicle and sends Fullstory event", async () => {
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

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false),
      expectCheckedValue(result, lateMasterCheckboxTestId, false)

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    expectIndeterminateValue(result, lateMasterCheckboxTestId, true)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle2.runId}`)
    )

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)

    expectIndeterminateValue(result, missingMasterCheckboxId, false),
      expectCheckedValue(result, missingMasterCheckboxId, false)

    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    expectIndeterminateValue(result, missingMasterCheckboxId, true),
      expectCheckedValue(result, missingMasterCheckboxId, false)

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

    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, false)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, false)

    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))
    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, true)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, true)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    expectCheckedValue(result, `row-checkbox-${lateVehicle1.runId}`, false)
    expectCheckedValue(result, `row-checkbox-${lateVehicle2.runId}`, true)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, true)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)

    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, true)

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

    await userEvent.click(result.getByTestId(missingMasterCheckboxId))
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost1.runId}`, true)
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost2.runId}`, true)

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

    await userEvent.click(result.getByTestId(missingMasterCheckboxId))

    expectCheckedValue(result, `row-checkbox-${missingLogonGhost1.runId}`, true)
    expectCheckedValue(result, `row-checkbox-${missingLogonGhost2.runId}`, true)
    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, true)

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

    await userEvent.click(result.getAllByTitle("Include Hidden")[0])

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(4)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(6)

    expectIndeterminateValue(result, lateMasterCheckboxTestId, false)
    expectCheckedValue(result, lateMasterCheckboxTestId, false)
    expectIndeterminateValue(result, missingMasterCheckboxId, false)
    expectCheckedValue(result, missingMasterCheckboxId, false)

    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))
    expect(result.getByText("2 selected")).toBeTruthy()
    await userEvent.click(result.getByTestId(lateMasterCheckboxTestId))

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
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)

    await userEvent.click(result.getByRole("button", { name: /Undo/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(4)
  })

  test("eye toggle toggles visibility of non-permanently-hidden rows", async () => {
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

    expect(result.queryByTitle("Include Hidden")).toBeNull()
    expect(result.queryByTitle("Exclude Hidden")).toBeNull()
    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)
    expect(result.getAllByTitle("Include Hidden")).toHaveLength(2)
    expect(result.queryAllByTitle("Exclude Hidden")).toHaveLength(0)

    await userEvent.click(result.getAllByTitle("Include Hidden")[0])

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(4)

    expect(result.queryAllByTitle("Include Hidden")).toHaveLength(0)
    expect(result.getAllByTitle("Exclude Hidden")).toHaveLength(2)

    await userEvent.click(result.getAllByTitle("Exclude Hidden")[0])

    expect(result.getAllByTitle("Include Hidden")).toHaveLength(2)
    expect(result.queryAllByTitle("Exclude Hidden")).toHaveLength(0)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(2)
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)

    expect(tagManagerEvent).toHaveBeenCalledWith("clicked_eye_toggle")
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

    await userEvent.click(
      result.getByTestId(`row-checkbox-${missingLogonGhost1.runId}`)
    )
    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)

    result.rerender(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    expect(result.getAllByTestId(/row-checkbox/)).toHaveLength(2)
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

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle1.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))
    await userEvent.click(result.getAllByTitle("Include Hidden")[0])

    expect(result.getAllByTitle("Exclude Hidden")).toHaveLength(2)
    expect(result.queryAllByTitle("Include Hidden")).toHaveLength(0)
    expect(result.getAllByTestId(/row-data/)).toHaveLength(2)

    await userEvent.click(
      result.getByTestId(`row-checkbox-${lateVehicle2.runId}`)
    )
    await userEvent.click(result.getByRole("button", { name: /Hide/ }))

    expect(result.queryAllByTestId(/row-checkbox/)).toHaveLength(0)
    expect(result.queryAllByTitle("Exclude Hidden")).toHaveLength(0)
    expect(result.getAllByTitle("Include Hidden")).toHaveLength(2)
  })
})
