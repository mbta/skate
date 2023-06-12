import { renderHook } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DivIcon } from "leaflet"
import React from "react"
import { MapContainer } from "react-leaflet"
import {
  DivIconOptions,
  useReactDivIcon,
} from "../../../../src/components/map/utilities/reactDivIcon"

const renderHookReactDivIcon = (initialProps?: DivIconOptions) =>
  renderHook((props) => useReactDivIcon(props), {
    wrapper: ({ children }) => <MapContainer children={children} />,
    initialProps,
  })

describe("useReactDivIcon", () => {
  test("should return divIcon and icon element", () => {
    const { result } = renderHookReactDivIcon()

    expect(result.current.divIcon).toBeInstanceOf(DivIcon)
    expect(result.current.iconContainer).toBeEmptyDOMElement()
  })

  test("when given custom options, should return divIcon and icon element", () => {
    const { result } = renderHookReactDivIcon({
      className: "testClass",
      iconSize: [20, 20],
    })

    expect(result.current.divIcon).toBeInstanceOf(DivIcon)
    expect(result.current.iconContainer).toBeEmptyDOMElement()
  })

  test("when options change, should replace divIcon", () => {
    const options: DivIconOptions = {
      className: "testClass",
      iconSize: [20, 20],
    }
    const { result, rerender } = renderHookReactDivIcon(options)

    const { divIcon: initialDivIcon, iconContainer: initialIconContainer } =
      result.current

    rerender({ ...options, className: "newClass" })

    expect(result.current.divIcon).toBeInstanceOf(DivIcon)
    expect(result.current.iconContainer).toBeEmptyDOMElement()
    expect(result.current.divIcon).not.toBe(initialDivIcon)
    expect(result.current.iconContainer).toBe(initialIconContainer)
  })
})
