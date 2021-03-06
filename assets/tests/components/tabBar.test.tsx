import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import renderer from "react-test-renderer"
import TabBar from "../../src/components/tabBar"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import * as browser from "../../src/models/browser"
import {
  initialState,
  toggleNotificationDrawer,
  toggleSwingsView,
  toggleLateView,
} from "../../src/state"
import featureIsEnabled from "../../src/laboratoryFeatures"

window.Appcues = {
  identify: jest.fn(),
  page: jest.fn(),
  show: jest.fn(),
}

window.drift = {
  api: {
    sidebar: {
      toggle: jest.fn(),
    },
  },
}

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

describe("tabBar", () => {
  it("renders", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            swingsViewIsVisible={false}
            lateViewIsVisible={false}
          />
        </BrowserRouter>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  it("renders with late view icon", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(
      (feature) => feature === "late_view"
    )

    const tree = renderer
      .create(
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            swingsViewIsVisible={false}
            lateViewIsVisible={false}
          />
        </BrowserRouter>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  it("sets class to visible when picker is visible", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={true}
          swingsViewIsVisible={false}
          lateViewIsVisible={false}
        />
      </BrowserRouter>
    )
    expect(wrapper.find(".m-tab-bar").hasClass("visible")).toBe(true)
    expect(wrapper.find(".m-tab-bar").hasClass("hidden")).toBe(false)
  })

  it("sets class to hidden when picker is hidden", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={false}
          swingsViewIsVisible={false}
          lateViewIsVisible={false}
        />
      </BrowserRouter>
    )
    expect(wrapper.find(".m-tab-bar").hasClass("hidden")).toBe(true)
    expect(wrapper.find(".m-tab-bar").hasClass("visible")).toBe(false)
  })

  it("reloads the page when you click on the logo", () => {
    const reloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementationOnce(() => ({}))

    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={false}
          swingsViewIsVisible={false}
          lateViewIsVisible={false}
        />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__logo").first().simulate("click")

    expect(reloadSpy).toHaveBeenCalled()
  })

  test("clicking the notification icon toggles the notification drawer", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            swingsViewIsVisible={false}
            lateViewIsVisible={false}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__notifications").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(toggleNotificationDrawer())
  })

  test("clicking the swings icon toggles the swings view and sends Fullstory event", () => {
    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }
    window.username = "username"

    afterEach(() => {
      window.FS = originalFS
      window.username = originalUsername
    })
    const dispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            swingsViewIsVisible={false}
            lateViewIsVisible={false}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__swings").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(toggleSwingsView())

    expect(window.FS!.event).toHaveBeenCalledWith("Swings view toggled")
  })

  test("clicking the late view icon toggles the late view", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(
      (feature) => feature === "late_view"
    )

    const dispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            swingsViewIsVisible={false}
            lateViewIsVisible={false}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__late_view").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(toggleLateView())
  })

  it("opens drift when you click on the chat icon", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={false}
          swingsViewIsVisible={false}
          lateViewIsVisible={false}
        />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__drift").first().simulate("click")

    expect(window.drift.api.sidebar.toggle).toHaveBeenCalled()
  })

  it("displays an appcue for the current page when you click on the help button", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={false}
          swingsViewIsVisible={false}
          lateViewIsVisible={false}
        />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__help").first().simulate("click")

    expect(window.Appcues!.show).toHaveBeenCalledWith("-M2dVpHSaOJ4PddV1K9i")
  })

  it("reloads the page when you click on the refresh button", () => {
    const reloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementationOnce(() => ({}))

    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={false}
          swingsViewIsVisible={false}
          lateViewIsVisible={false}
        />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__refresh").first().simulate("click")

    expect(reloadSpy).toHaveBeenCalled()
  })
})
