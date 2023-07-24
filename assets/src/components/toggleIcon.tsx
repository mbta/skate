import React from "react"
import { ToggleOnIcon, ToggleOffIcon } from "../helpers/icon"
import { SvgIconWrapperProps } from "../helpers/svgIcon"

export interface ToggleIconProps extends SvgIconWrapperProps {
  active: boolean
}

export const ToggleIcon = ({ active, ...props }: ToggleIconProps) =>
  active ? <ToggleOnIcon {...props} /> : <ToggleOffIcon {...props} />
