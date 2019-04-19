// @ts-ignore
import closeIconSvg from "../../static/images/icon-close-x.svg"
import renderSvg from "./renderSvg"

export const closeIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, closeIconSvg)
