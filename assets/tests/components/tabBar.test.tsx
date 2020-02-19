import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import renderer from "react-test-renderer"
import TabBar from "../../src/components/tabBar"
import * as browser from "../../src/models/browser"

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

    wrapper
      .find(".m-tab-bar__logo")
      .first()
      .simulate("click")

    expect(reloadSpy).toHaveBeenCalled()
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

    wrapper
      .find(".m-tab-bar__refresh")
      .first()
      .simulate("click")

    expect(reloadSpy).toHaveBeenCalled()
  })
})
