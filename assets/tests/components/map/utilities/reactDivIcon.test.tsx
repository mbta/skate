import { renderHook } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DivIcon, PointTuple } from "leaflet"
import React from "react"
import { MapContainer } from "react-leaflet"
import {
  DivIconOptions,
  useReactDivIcon,
} from "../../../../src/components/map/utilities/reactDivIcon"

const renderHookReactDivIcon = (initialProps?: DivIconOptions) =>
  renderHook((props) => useReactDivIcon(props), {
    wrapper: ({ children }) => <MapContainer>{children}</MapContainer>,
    initialProps,
  })

describe("useReactDivIcon", () => {
  test("should return divIcon and icon element", () => {
    const { result } = renderHookReactDivIcon()

    expect(result.current.divIcon).toBeInstanceOf(DivIcon)
    expect(result.current.iconContainer).toBeEmptyDOMElement()
  })

  test("when given custom options, should return divIcon and icon element", () => {
    const className = "testClass"

    const iconSize: PointTuple = [20, 20]
    const [size_x, size_y] = iconSize

    const { result } = renderHookReactDivIcon({
      className,
      iconSize,
    })
    const newIcon = result.current.divIcon?.createIcon()

    expect(newIcon).toHaveClass(className)
    expect(newIcon).toHaveStyle({ height: `${size_y}px`, width: `${size_x}px` })
  })

  test("when options change, should replace divIcon with changes", () => {
    const initialClassName = "initialClass"
    const newClassName = "newClass"

    const initialOptions: DivIconOptions = {
      className: initialClassName,
    }

    const { result, rerender } = renderHookReactDivIcon(initialOptions)

    const { divIcon: initialDivIcon } = result.current
    const icon = initialDivIcon?.createIcon()
    expect(icon).toHaveClass(initialClassName)

    rerender({ ...initialOptions, className: newClassName })

    expect(result.current.divIcon).not.toBe(initialDivIcon)
    expect(result.current.divIcon?.createIcon(icon)).toHaveClass(newClassName)
    expect(result.current.divIcon?.createIcon()).toHaveClass(newClassName)
  })

  test("when options change, should not replace iconContainer", () => {
    const newClassName = "newClass"

    const { result, rerender } = renderHookReactDivIcon()
    const { iconContainer: initialIconContainer } = result.current

    expect(result.current.iconContainer).toBeEmptyDOMElement()

    rerender({ className: newClassName })

    expect(result.current.divIcon?.createIcon()).toHaveClass(newClassName)
    expect(result.current.iconContainer).toBeEmptyDOMElement()
    expect(result.current.iconContainer).toBe(initialIconContainer)
  })
})
