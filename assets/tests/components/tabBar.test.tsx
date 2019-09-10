import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import TabBar from "../../src/components/tabBar"

describe("tabBar", () => {
  it("sets class to hidden when picker is hidden", () => {
    const wrapper = mount(
      <BrowserRouter>
        <TabBar pickerContainerIsVisible={false} />
      </BrowserRouter>
    )
    expect(wrapper.find(".m-tab-bar").hasClass("hidden")).toBe(true)
    expect(wrapper.find(".m-tab-bar").hasClass("visible")).toBe(false)
  })
})
