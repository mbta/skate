import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import renderer from "react-test-renderer"
import TabBar from "../../src/components/tabBar"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import * as browser from "../../src/models/browser"
import {
  initialState,
  OpenView,
  openSwingsView,
  openLateView,
  openNotificationDrawer,
} from "../../src/state"
import featureIsEnabled from "../../src/laboratoryFeatures"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"

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
jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

describe("tabBar", () => {
  it("renders", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            openView={OpenView.None}
            dispatcherFlag={false}
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
            openView={OpenView.None}
            dispatcherFlag={false}
          />
        </BrowserRouter>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  it("renders with late view icon when dispatcher flag is set", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            openView={OpenView.None}
            dispatcherFlag={true}
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
          openView={OpenView.None}
          dispatcherFlag={false}
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
          openView={OpenView.None}
          dispatcherFlag={false}
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
          openView={OpenView.None}
          dispatcherFlag={false}
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
            openView={OpenView.None}
            dispatcherFlag={false}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__notifications").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(openNotificationDrawer())
  })

  test("clicking the swings icon toggles the swings view and sends Fullstory event", () => {
    const dispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            openView={OpenView.None}
            dispatcherFlag={false}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__swings").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(openSwingsView())
    expect(tagManagerEvent).toHaveBeenCalledWith("swings_view_toggled")
  })

  test("clicking the late view icon toggles the late view and sends Fullstory event", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(
      (feature) => feature === "late_view"
    )

    const dispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TabBar
            pickerContainerIsVisible={true}
            openView={OpenView.None}
            dispatcherFlag={false}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__late_view").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(openLateView())
    expect(tagManagerEvent).toHaveBeenCalledWith("late_view_toggled")
  })

  it("opens drift when you click on the chat icon", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar
          pickerContainerIsVisible={false}
          openView={OpenView.None}
          dispatcherFlag={false}
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
          openView={OpenView.None}
          dispatcherFlag={false}
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
          openView={OpenView.None}
          dispatcherFlag={false}
        />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__refresh").first().simulate("click")

    expect(reloadSpy).toHaveBeenCalled()
  })
})
