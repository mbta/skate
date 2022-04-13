import React from "react"
import renderSvg from "../../src/helpers/renderSvg"

test("renders the given svg content in a span element with a class name", () => {
  const className = "test-class-name"
  const svgText = "svg text"

  /* eslint-disable react/no-danger */
  const expected = (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: "svg text",
      }}
    />
  )
  /* eslint-enable react/no-danger */

  const result = renderSvg(className, svgText)

  expect(result).toEqual(expected)
})
