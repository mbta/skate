import React from "react"

export default (className: string, svgText: string): JSX.Element => (
  <span className={className} dangerouslySetInnerHTML={{ __html: svgText }} />
)
