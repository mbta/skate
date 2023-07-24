import React, { ComponentPropsWithoutRef } from "react"

/**
 * Interactive variant of the `CircleXIcon`.
 *
 * Implements focus and hover states via CSS and SVG.
 */
export const CircleXIcon = (props: ComponentPropsWithoutRef<"svg">) => (
  <svg
    className="c-circle-x-icon"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx="50%"
      cy="50%"
      r="75%"
      className="c-circle-x-icon__focus-circle"
    />
    <circle cx="50%" cy="50%" r="75%" className="c-circle-x-icon__white-fill" />
    <path
      className="c-circle-x-icon__path"
      d="m24 .05a24 24 0 1 0 24 23.95 24 24 0 0 0 -24-23.95zm13.19 32.54a3.33 3.33 0 1 1 -4.73 4.69l-8.46-8.57-8.57 8.48a3.33 3.33 0 1 1 -4.69-4.73l8.55-8.46-8.48-8.57a3.33 3.33 0 1 1 4.73-4.69l8.46 8.55 8.57-8.48a3.33 3.33 0 0 1 2.35-1 3.35 3.35 0 0 1 3.33 3.35 3.33 3.33 0 0 1 -1 2.35l-8.54 8.49z"
    />
  </svg>
)
