import React from "react"
import { describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import * as bsIcons from "../../src/helpers/bsIcons"

describe("Bootstrap Icon", () => {
  // Encode the "rules" of what a icon element should support as tests
  describe.each(
    Object.entries(bsIcons).map(([name, BsIcon]) => ({ name, BsIcon }))
  )("$name", ({ BsIcon }) => {
    test("root element is an SVG", () => {
      const { container } = render(<BsIcon />)

      expect(container.firstChild?.nodeName).toBe("svg")
    })

    test("has `viewBox` attribute", () => {
      const { container } = render(<BsIcon />)

      expect(container.firstChild).toHaveAttribute("viewBox")
    })

    test("has `bi` class", () => {
      const { container } = render(<BsIcon />)

      expect(container.firstChild).toHaveClass("bi")
    })

    test("has `aria-hidden` attribute", () => {
      const { container } = render(<BsIcon />)

      expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
    })

    test("can override `aria-hidden`", () => {
      const { container } = render(<BsIcon aria-hidden={false} />)

      expect(container.firstChild).toHaveAttribute("aria-hidden", "false")
    })

    test("can override `className`", () => {
      const { container } = render(<BsIcon className="test-class" />)

      expect(container.firstChild).toHaveClass("test-class")
      expect(container.firstChild).not.toHaveClass("bi")
    })

    test("can add other props", () => {
      const { container } = render(<BsIcon data-test-attribute="test" />)

      expect(container.firstChild).toHaveAttribute(
        "data-test-attribute",
        "test"
      )
    })
  })
})
