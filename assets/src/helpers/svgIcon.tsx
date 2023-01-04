import React, { ComponentPropsWithoutRef } from "react"

// https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#wrappingmirroring
interface SvgIconProps extends ComponentPropsWithoutRef<"span"> {
  svgText: string
}

export const SvgIcon = ({ svgText, ...props }: SvgIconProps) => (
  // eslint-disable-next-line react/no-danger
  <span {...props} dangerouslySetInnerHTML={{ __html: svgText }} />
)

export const svgIcon =
  (svgText: string) => (props: ComponentPropsWithoutRef<"span">) =>
    <SvgIcon svgText={svgText} {...props} />
