import React from "react"
import {
  closeIcon,
  ladderIcon,
  mapIcon,
  reverseIcon,
} from "../../src/helpers/icon"

describe("closeIcon", () => {
  it("renders", () => {
    const expected = (
      <span
        className=""
        dangerouslySetInnerHTML={{
          __html: "SVG",
        }}
      />
    )

    const result = closeIcon()

    expect(result).toEqual(expected)
  })
})

describe("ladderIcon", () => {
  it("returns an svg", () => {
    const icon = ladderIcon()

    expect(icon.type).toBe("svg")
  })
})

describe("mapIcon", () => {
  it("is defined as an svg", () => {
    const icon = mapIcon()

    expect(icon.type).toBe("svg")
  })
})

describe("reverseIcon", () => {
  it("renders an accessibility icon with a class name", () => {
    const className = "test-class-name"

    const expected = (
      <span
        className={className}
        dangerouslySetInnerHTML={{
          __html: "SVG",
        }}
      />
    )

    const result = reverseIcon(className)

    expect(result).toEqual(expected)
  })

  it("renders without a class name", () => {
    const expected = (
      <span
        className=""
        dangerouslySetInnerHTML={{
          __html: "SVG",
        }}
      />
    )

    const result = reverseIcon()

    expect(result).toEqual(expected)
  })
})
