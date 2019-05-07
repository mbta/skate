// @ts-ignore
import collapseIconSvg from "../../static/images/icon-caret-left.svg"
// @ts-ignore
import expandIconSvg from "../../static/images/icon-caret-right.svg"
// @ts-ignore
import circleXIconSvg from "../../static/images/icon-circle-x.svg"
// @ts-ignore
import closeIconSvg from "../../static/images/icon-close-x.svg"
// @ts-ignore
import reverseIconSvg from "../../static/images/icon-reverse-normal.svg"
// @ts-ignore
import reverseIconReversedSvg from "../../static/images/icon-reverse-reversed.svg"
import renderSvg from "./renderSvg"

export const circleXIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, circleXIconSvg)

export const closeIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, closeIconSvg)

export const collapseIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, collapseIconSvg)

export const expandIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, expandIconSvg)

export const reverseIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconSvg)

export const reverseIconReversed = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconReversedSvg)
