import React from "react"
import { intersperseString } from "../helpers/array"
import { filterToAlphanumeric } from "../models/searchQuery"

export const HighlightedMatch = ({
  content,
  highlightText,
  individualWordMatch,
}: {
  content: string
  highlightText?: string
  individualWordMatch?: boolean
}): JSX.Element => {
  if (highlightText === undefined) {
    return <>{content}</>
  }

  const regexp = individualWordMatch
    ? new RegExp(
        "(" +
          [highlightText, ...highlightText.split(/\s+/)]
            .map((s) => highlightRegex(s).source)
            .join("|") +
          ")",
        "i"
      )
    : highlightRegex(highlightText)

  return <HighlightedMatchHelper content={content} regexp={regexp} />
}

const HighlightedMatchHelper = ({
  content,
  regexp,
}: {
  content: string
  regexp: RegExp
}): JSX.Element => {
  const match = content.match(regexp)

  if (match === null || match.index === undefined) {
    return <>{content}</>
  }

  const matchingString = match[0]

  return (
    <>
      {[
        content.slice(0, match.index),
        <span className="highlighted" key={`highlighted-${match.index}`}>
          {matchingString}
        </span>,
        <HighlightedMatchHelper
          content={content.slice(match.index + match[0].length)}
          regexp={regexp}
          key={`highlighted-extension-${match.index + match[0].length}`}
        />,
      ]}
    </>
  )
}

const highlightRegex = (highlightText: string): RegExp => {
  const stripped = filterToAlphanumeric(highlightText)
  const allowNonAlphanumeric = intersperseString(stripped, "[^0-9a-zA-Z]*")
  return new RegExp(allowNonAlphanumeric, "i")
}
