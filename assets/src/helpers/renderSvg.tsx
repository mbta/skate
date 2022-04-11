import React from "react"

export default (className: string, svgText: string): JSX.Element => (
  // eslint-disable-next-line react/no-danger
  <span className={className} dangerouslySetInnerHTML={{ __html: svgText }} />
)
