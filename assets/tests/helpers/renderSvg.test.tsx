import React from "react"
import renderSvg from "../../src/helpers/renderSvg"

/* eslint-disable react/no-danger */

test("renders the given svg content in a span element with a class name", () => {
  const className = "test-class-name"
  const svgText = "svg text"

  const expected = (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: "svg text",
      }}
    />
  )

  const result = renderSvg(className, svgText)

  expect(result).toEqual(expected)
})

/* eslint-enable react/no-danger */
