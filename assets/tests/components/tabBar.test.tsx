import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import renderer from "react-test-renderer"
import TabBar from "../../src/components/tabBar"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import * as browser from "../../src/models/browser"
import { initialState, toggleNotificationDrawer } from "../../src/state"

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
          <TabBar pickerContainerIsVisible={true} />
        </BrowserRouter>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  it("sets class to visible when picker is visible", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar pickerContainerIsVisible={true} />
      </BrowserRouter>
    )
    expect(wrapper.find(".m-tab-bar").hasClass("visible")).toBe(true)
    expect(wrapper.find(".m-tab-bar").hasClass("hidden")).toBe(false)
  })

  it("sets class to hidden when picker is hidden", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar pickerContainerIsVisible={false} />
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
        <TabBar pickerContainerIsVisible={false} />
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
          <TabBar pickerContainerIsVisible={true} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    wrapper.find(".m-tab-bar__notifications").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(toggleNotificationDrawer())
  })

  it("opens drift when you click on the chat icon", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar pickerContainerIsVisible={false} />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__drift").first().simulate("click")

    expect(window.drift.api.sidebar.toggle).toHaveBeenCalled()
  })

  it("displays an appcue for the current page when you click on the help button", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar pickerContainerIsVisible={false} />
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
        <TabBar pickerContainerIsVisible={false} />
      </BrowserRouter>
    )

    wrapper.find(".m-tab-bar__refresh").first().simulate("click")

    expect(reloadSpy).toHaveBeenCalled()
  })
})
