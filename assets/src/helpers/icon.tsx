// @ts-ignore
import circleXIconSvg from "../../static/images/icon-circle-x.svg"
// @ts-ignore
import closeIconSvg from "../../static/images/icon-close-x.svg"
import renderSvg from "./renderSvg"

export const circleXIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, circleXIconSvg)

export const closeIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, closeIconSvg)
