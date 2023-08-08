import React from "react"
import { intersperseString } from "../helpers/array"
import { filterToAlphanumeric } from "../models/searchQuery"

export const HighlightedMatch = ({
  content,
  highlightText,
}: {
  content: string
  highlightText?: string
}): JSX.Element => {
  if (highlightText === undefined) {
    return <>{content}</>
  }

  const match = content.match(highlightRegex(highlightText))

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
        <HighlightedMatch
          content={content.slice(match.index + match[0].length)}
          highlightText={highlightText}
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
