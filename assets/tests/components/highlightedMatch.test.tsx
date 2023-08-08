import React from "react"
import renderer from "react-test-renderer"
import { HighlightedMatch } from "../../src/components/highlightedMatch"

describe("HighlightedMatch", () => {
  test("renders the content, wrapping the matching text in a span", () => {
    const content = "SMITH #20138713820"
    const highlightText = "138"

    const tree = renderer.create(
      <HighlightedMatch content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("is insensitive in its matching", () => {
    const content = "SMITH #201387 tmits"
    const highlightText = "mit"

    const tree = renderer.create(
      <HighlightedMatch content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("ignores spaces and hyphens", () => {
    const content = "abcde-f gh"
    const highlightText = "b c-defg"
    const tree = renderer.create(
      <HighlightedMatch content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("can highlight the whole string", () => {
    const content = "abc"
    const highlightText = "abc"
    const tree = renderer.create(
      <HighlightedMatch content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("renders the original content if no highlight text is specified", () => {
    const content = "SMITH #201387"

    const tree = renderer.create(<HighlightedMatch content={content} />)

    expect(tree).toMatchSnapshot()
  })
})
