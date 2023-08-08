import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { HighlightedMatch } from "../../src/components/highlightedMatch"

describe("HighlightedMatch", () => {
  test("renders the content, wrapping the matching text in a span", () => {
    const content = "SMITH #20138713820"
    const highlightText = "138"

    render(<HighlightedMatch content={content} highlightText={highlightText} />)

    const matches = screen.getAllByText(highlightText)

    expect(matches).toHaveLength(2)

    matches.forEach((element) => expect(element).toHaveClass("highlighted"))
  })

  test("is insensitive in its matching", () => {
    const content = "SMITH #201387 tmits"
    const highlightText = "mit"

    render(<HighlightedMatch content={content} highlightText={highlightText} />)

    const matches = screen.getAllByText(new RegExp(highlightText, "i"))

    expect(matches).toHaveLength(2)

    matches.forEach((element) => expect(element).toHaveClass("highlighted"))
  })

  test("ignores spaces and hyphens", () => {
    const content = "abcde-f gh"
    const highlightText = "b c-defg"

    render(<HighlightedMatch content={content} highlightText={highlightText} />)

    expect(screen.getByText("bcde-f g")).toHaveClass("highlighted")
  })

  test("can highlight the whole string", () => {
    const content = "abc"
    const highlightText = "abc"

    render(<HighlightedMatch content={content} highlightText={highlightText} />)

    expect(screen.getByText(highlightText)).toHaveClass("highlighted")
  })

  test("renders the original content if no highlight text is specified", () => {
    const content = "SMITH #201387"

    render(<HighlightedMatch content={content} />)

    expect(screen.getByText(content)).not.toHaveClass("highlighted")
  })
})
