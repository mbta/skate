import React from "react"
import { closeIcon } from "../../src/helpers/icon"

describe("closeIcon", () => {
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

    const result = closeIcon(className)

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

    const result = closeIcon()

    expect(result).toEqual(expected)
  })
})
