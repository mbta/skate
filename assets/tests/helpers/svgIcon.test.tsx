import { render, screen } from "@testing-library/react"
import React from "react"
import { SvgIcon, svgIcon } from "../../src/helpers/svgIcon"
import "@testing-library/jest-dom"

describe("<SvgIcon/>", () => {
  test("renders the given svg content in a span element with a class name", () => {
    const className = "test-class-name"
    const svgText = "svg text"

    const result = render(
      <SvgIcon
        svgText={`<svg>${svgText}</svg>`}
        className={className}
      ></SvgIcon>
    ).asFragment()

    expect(result).toEqual(
      render(
        <span className={className}>
          <svg>{svgText}</svg>
        </span>
      ).asFragment()
    )
  })
})

describe("svgIcon(text) -> (props)", () => {
  describe("first function returns react element which renders `svgText` and passed props", () => {
    test("when called via function call", () => {
      const className = "test-class-name"
      const svgText = "<svg><title>hello test</title></svg>"

      const TestSvgTextElement = svgIcon(svgText)
      const { container } = render(
        TestSvgTextElement({ className, role: "img" })
      )

      expect(container).toEqual(
        render(
          <span className={className} role="img">
            <svg>
              <title>hello test</title>
            </svg>
          </span>
        ).container
      )
    })

    test("when used via JSX", () => {
      const className = "test-class-name"
      const spanTitle = "test span title"
      const svgText = `<svg role=presentation></svg>`

      const TestSvgTextElement = svgIcon(svgText)
      render(
        <TestSvgTextElement
          title={spanTitle}
          className={className}
          role="img"
          aria-hidden={true}
        />
      )

      expect(screen.getByRole("img", { hidden: true })).toHaveAttribute(
        "title",
        spanTitle
      )
      expect(screen.getByRole("img", { hidden: true })).toHaveClass(className)
      expect(
        screen.getByRole("presentation", { hidden: true })
      ).toBeInTheDocument()
    })
  })
})
