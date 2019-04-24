import React from "react"

export default (className: string, svgText: string): JSX.Element => (
  <span
    className={className}
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: svgText }}
  />
)
