import React, { ComponentPropsWithoutRef, forwardRef } from "react"

// https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#wrappingmirroring
interface SvgIconProps extends ComponentPropsWithoutRef<"span"> {
  svgText: string
}

export const SvgIcon = forwardRef<HTMLSpanElement, SvgIconProps>(
  ({ svgText, ...props }, ref) => (
    // eslint-disable-next-line react/no-danger
    <span ref={ref} {...props} dangerouslySetInnerHTML={{ __html: svgText }} />
  )
)

export const svgIcon = (svgText: string) =>
  forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
    (props, ref) => <SvgIcon {...props} ref={ref} svgText={svgText} />
  )
