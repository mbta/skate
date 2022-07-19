import { mount, ReactWrapper } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"

import App from "../../src/components/app"
import LateView from "../../src/components/lateView"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../../src/contexts/vehiclesByRouteIdContext"
import {
  initialState,
  OpenView,
  State,
  selectVehicle,
  toggleLateView,
} from "../../src/state"
import blockWaiverFactory from "../factories/blockWaiver"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.spyOn(Date, "now").mockImplementation(() => {
  return 18000 * 1000
})

const state: State = { ...initialState, openView: OpenView.Late }
const lateMasterCheckboxSelector =
  ".m-late-view__late-buses .m-late-view__master-checkbox"
const missingMasterCheckboxSelector =
  ".m-late-view__missing-logons .m-late-view__master-checkbox"

const expectIsIndeterminate = (
  mountedWrapper: ReactWrapper,
  selector: string
) =>
  expect(
    (mountedWrapper.find(selector).first().getDOMNode() as HTMLInputElement)
      .indeterminate
  )

const expectIsChecked = (mountedWrapper: ReactWrapper, selector: string) =>
  expect(
    (mountedWrapper.find(selector).first().getDOMNode() as HTMLInputElement)
      .checked
  )

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

  test("clicking tab closes late view", () => {
    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{}}>
          <App />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    expect(wrapper.find(".m-late-view"))

    wrapper
      .find(".m-late-view .c-drawer-tab__tab-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(toggleLateView())
  })

  test("clicking ghost run number opens ghost and sends Fullstory event", () => {
    const ghost = ghostFactory.build({
      routeId: "route",
      runId: "12345",
      scheduledLogonTime: 15299,
      currentPieceFirstRoute: "route",
      currentPieceStartPlace: "garage",
    })

    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{ route: [ghost] }}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-late-view__run-link").first().simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(ghost))

    expect(tagManagerEvent).toHaveBeenCalledWith(
      "selected_late_view_run_number_ghost"
    )
  })

  test("clicking vehicle run number opens vehicle and sends Fullstory event", () => {
    const vehicle = vehicleFactory.build({
      routeId: "route",
      scheduleAdherenceSecs: 901,
    })

    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{ route: [vehicle] }}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-late-view__run-link").first().simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))

    expect(tagManagerEvent).toHaveBeenCalledWith(
      "selected_late_view_run_number"
    )
  })

  test("clicking hide checkbox toggles row selection state", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    expect(
      wrapper.find('.m-late-view__data-row input[type="checkbox"]')
    ).toHaveLength(3)
    expect(
      wrapper.find('.m-late-view__data-row--selected input[type="checkbox"]')
    ).toHaveLength(0)
    expect(
      wrapper.find('.m-late-view__data-row--unselected input[type="checkbox"]')
    ).toHaveLength(3)

    act(() => {
      wrapper
        .find('.m-late-view__data-row--unselected input[type="checkbox"]')
        .first()
        .simulate("click")
    })
    expect(
      wrapper.find('.m-late-view__data-row--unselected input[type="checkbox"]')
    ).toHaveLength(2)
    expect(
      wrapper.find('.m-late-view__data-row--selected input[type="checkbox"]')
    ).toHaveLength(1)

    act(() => {
      wrapper
        .find('.m-late-view__data-row--selected input[type="checkbox"]')
        .first()
        .simulate("click")
    })
    expect(
      wrapper.find('.m-late-view__data-row--unselected input[type="checkbox"]')
    ).toHaveLength(3)
    expect(
      wrapper.find('.m-late-view__data-row--selected input[type="checkbox"]')
    ).toHaveLength(0)
  })

  test("master checkbox state responds to individual checkbox states", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")
    })
    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(true)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .last()
        .simulate("click")
    })
    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(true)

    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")
    })
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(true)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .last()
        .simulate("click")
    })
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(true)
  })

  test("master checkbox toggles multiple rows", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    expect(
      wrapper.find(
        '.m-late-view__late-buses .m-late-view__data-row--selected input[type="checkbox"]'
      )
    ).toHaveLength(0)

    act(() => {
      wrapper.find(lateMasterCheckboxSelector).first().simulate("click")
    })
    expect(
      wrapper.find(
        '.m-late-view__late-buses .m-late-view__data-row--selected input[type="checkbox"]'
      )
    ).toHaveLength(2)

    act(() => {
      wrapper
        .find('.m-late-view__data-row--selected input[type="checkbox"]')
        .first()
        .simulate("click")
    })
    expect(
      wrapper.find(
        '.m-late-view__late-buses .m-late-view__data-row--selected input[type="checkbox"]'
      )
    ).toHaveLength(1)

    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(true)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper.find(lateMasterCheckboxSelector).first().simulate("click")
    })
    expect(
      wrapper.find(
        '.m-late-view__late-buses .m-late-view__data-row--selected input[type="checkbox"]'
      )
    ).toHaveLength(2)
    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(true)

    act(() => {
      wrapper.find(lateMasterCheckboxSelector).first().simulate("click")
    })
    expect(
      wrapper.find(
        '.m-late-view__late-buses .m-late-view__data-row--selected input[type="checkbox"]'
      )
    ).toHaveLength(0)
    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)

    expect(
      wrapper.find(
        '.m-late-view__missing-logons .m-late-view__data-row--selected input[type="checkbox"]'
      )
    ).toHaveLength(0)

    act(() => {
      wrapper.find(missingMasterCheckboxSelector).first().simulate("click")
    })
    expect(
      wrapper.find(
        ".m-late-view__missing-logons .m-late-view__data-row--selected"
      )
    ).toHaveLength(2)

    act(() => {
      wrapper
        .find('.m-late-view__data-row--selected input[type="checkbox"]')
        .first()
        .simulate("click")
    })
    expect(
      wrapper.find(
        ".m-late-view__missing-logons .m-late-view__data-row--selected"
      )
    ).toHaveLength(1)
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(true)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(false)
    act(() => {
      wrapper.find(missingMasterCheckboxSelector).first().simulate("click")
    })
    expect(
      wrapper.find(
        ".m-late-view__missing-logons .m-late-view__data-row--selected"
      )
    ).toHaveLength(2)
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(true)

    act(() => {
      wrapper.find(missingMasterCheckboxSelector).first().simulate("click")
    })
    expect(
      wrapper.find(
        ".m-late-view__missing-logons .m-late-view__data-row--selected"
      )
    ).toHaveLength(0)
  })

  test("master checkbox state doesn't count hidden rows", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper.find(".m-late-view__hide-popup button").first().simulate("click")
    })

    expect(wrapper.find(".m-late-view__data-row")).toHaveLength(4)

    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper
        .find(".m-late-view__hide-toggle--hidden")
        .first()
        .simulate("click")
    })

    expect(wrapper.find(".m-late-view__data-row")).toHaveLength(6)

    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper.find(lateMasterCheckboxSelector).simulate("click")
    })
    expect(wrapper.text()).toContain("2 selected")
    act(() => {
      wrapper.find(lateMasterCheckboxSelector).simulate("click")
    })

    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")
    })
    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(true)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(true)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(false)

    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row--unselected input[type="checkbox"]'
        )
        .first()
        .simulate("click")
    })

    expectIsIndeterminate(wrapper, lateMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, lateMasterCheckboxSelector).toEqual(true)
    expectIsIndeterminate(wrapper, missingMasterCheckboxSelector).toEqual(false)
    expectIsChecked(wrapper, missingMasterCheckboxSelector).toEqual(true)
  })

  test("select rows and clicking hide button hides rows", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper.find(".m-late-view__hide-popup button").first().simulate("click")
    })

    expect(wrapper.find(".m-late-view__data-row--selected")).toHaveLength(0)

    expect(wrapper.find(".m-late-view__data-row--unselected")).toHaveLength(2)
  })

  test("can undo hiding, but only for a limited time", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper.find(".m-late-view__hide-popup button").first().simulate("click")
    })

    expect(wrapper.find(".m-late-view__data-row--selected")).toHaveLength(0)

    expect(wrapper.find(".m-late-view__data-row--unselected")).toHaveLength(2)

    act(() => {
      wrapper
        .find(".m-late-view__unhide-popup button")
        .first()
        .simulate("click")
    })
    expect(wrapper.find(".m-late-view__unhide-popup button")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__data-row--selected")).toHaveLength(0)
  })

  test("eye toggle toggles visibility of non-permanently-hidden rows", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    expect(wrapper.find(".m-late-view__hide-toggle--unhidden")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__hide-toggle--hidden")).toHaveLength(0)

    act(() => {
      wrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      wrapper.find(".m-late-view__hide-popup button").first().simulate("click")
    })

    expect(wrapper.find(".m-late-view__data-row--selected")).toHaveLength(0)

    expect(wrapper.find(".m-late-view__data-row--unselected")).toHaveLength(2)

    expect(wrapper.find(".m-late-view__hide-toggle--unhidden")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__hide-toggle--hidden")).toHaveLength(2)

    act(() => {
      wrapper
        .find(".m-late-view__hide-toggle--hidden")
        .first()
        .simulate("click")
    })

    expect(wrapper.find(".m-late-view__hide-toggle--unhidden")).toHaveLength(2)
    expect(wrapper.find(".m-late-view__hide-toggle--hidden")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__data-row")).toHaveLength(4)
    expect(
      wrapper.find('.m-late-view__data-row input[type="checkbox"]')
    ).toHaveLength(2)

    act(() => {
      wrapper
        .find(".m-late-view__hide-toggle--unhidden")
        .first()
        .simulate("click")
    })

    expect(wrapper.find(".m-late-view__hide-toggle--unhidden")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__hide-toggle--hidden")).toHaveLength(2)
    expect(wrapper.find(".m-late-view__data-row")).toHaveLength(2)
    expect(
      wrapper.find('.m-late-view__data-row input[type="checkbox"]')
    ).toHaveLength(2)
    expect(tagManagerEvent).toHaveBeenCalledWith("clicked_eye_toggle")
  })

  test("persist hidden rows between page loads", () => {
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

    const firstLoadWrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    act(() => {
      firstLoadWrapper
        .find(
          '.m-late-view__missing-logons .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      firstLoadWrapper
        .find(
          '.m-late-view__late-buses .m-late-view__data-row input[type="checkbox"]'
        )
        .first()
        .simulate("click")

      firstLoadWrapper
        .find(".m-late-view__hide-popup button")
        .first()
        .simulate("click")
    })
    expect(
      firstLoadWrapper.find(".m-late-view__data-row--selected")
    ).toHaveLength(0)

    expect(
      firstLoadWrapper.find(".m-late-view__data-row--unselected")
    ).toHaveLength(2)

    const reloadWrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    expect(reloadWrapper.find(".m-late-view__data-row--selected")).toHaveLength(
      0
    )

    expect(
      reloadWrapper.find(".m-late-view__data-row--unselected")
    ).toHaveLength(2)
  })

  test("if viewing hidden rows, and we hide a row, turn off eye toggle", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    act(() => {
      wrapper
        .find('.m-late-view__data-row--unselected input[type="checkbox"]')
        .first()
        .simulate("click")

      wrapper.find(".m-late-view__hide-popup button").first().simulate("click")

      wrapper.find(".m-late-view__hide-toggle").first().simulate("click")
    })

    expect(wrapper.find(".m-late-view__hide-toggle--unhidden")).toHaveLength(2)
    expect(wrapper.find(".m-late-view__hide-toggle--hidden")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__data-row--unselected")).toHaveLength(2)

    act(() => {
      wrapper
        .find('.m-late-view__data-row--unselected input[type="checkbox"]')
        .simulate("click")

      wrapper.find(".m-late-view__hide-popup button").first().simulate("click")
    })

    expect(wrapper.find(".m-late-view__data-row--unselected")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__hide-toggle--unhidden")).toHaveLength(0)
    expect(wrapper.find(".m-late-view__hide-toggle--hidden")).toHaveLength(2)
  })
})
