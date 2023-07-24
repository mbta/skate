import React, { ComponentPropsWithoutRef, forwardRef } from "react"

export type SvgIconWrapperProps = ComponentPropsWithoutRef<"span">

// https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#wrappingmirroring
interface SvgIconProps extends SvgIconWrapperProps {
  svgText: string
}

/**
 * Takes a SVG string and renders that as the `innerHTML` of the `container`
 * element.
 *
 * Also exposes valid props of the `container` element, and passes the `ref`
 * attribute to the `container` element.
 */
export const SvgIcon = forwardRef<HTMLSpanElement, SvgIconProps>(
  ({ svgText, ...props }, ref) => (
    // eslint-disable-next-line react/no-danger
    <span ref={ref} {...props} dangerouslySetInnerHTML={{ __html: svgText }} />
  )
)

/**
 * Factory to construct a {@link SvgIcon} Component Definition from SVG.
 *
 * @param svgText HTML representation of the Icon
 * @returns React Component Constructor
 */
export const svgIcon = (svgText: string) =>
  forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
    (props, ref) => <SvgIcon {...props} ref={ref} svgText={svgText} />
  )
