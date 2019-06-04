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

export const circleXIcon = (): JSX.Element => renderSvg("", circleXIconSvg)

export const closeIcon = (): JSX.Element => renderSvg("", closeIconSvg)

export const collapseIcon = (): JSX.Element => renderSvg("", collapseIconSvg)

export const expandIcon = (): JSX.Element => renderSvg("", expandIconSvg)

export const reverseIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconSvg)

export const reverseIconReversed = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconReversedSvg)
