// @ts-ignore
import collapseIconSvg from "../../static/images/icon-caret-left.svg"
// @ts-ignore
import expandIconSvg from "../../static/images/icon-caret-right.svg"
// @ts-ignore
import circleXIconSvg from "../../static/images/icon-circle-x.svg"
// @ts-ignore
import closeIconSvg from "../../static/images/icon-close-x.svg"
// @ts-ignore
import ladderIconSvg from "../../static/images/icon-ladder.svg"
// @ts-ignore
import mapIconSvg from "../../static/images/icon-map.svg"
// @ts-ignore
import reverseIconSvg from "../../static/images/icon-reverse-normal.svg"
// @ts-ignore
import reverseIconReversedSvg from "../../static/images/icon-reverse-reversed.svg"
// @ts-ignore
import searchIconSvg from "../../static/images/icon-search.svg"
// @ts-ignore
import skateLogoHalloweenIconSvg from "../../static/images/icon-skate-logo-halloween.svg"
// @ts-ignore
import skateLogoIconSvg from "../../static/images/icon-skate-logo.svg"
import renderSvg from "./renderSvg"

export const circleXIcon = (): JSX.Element => renderSvg("", circleXIconSvg)

export const closeIcon = (): JSX.Element => renderSvg("", closeIconSvg)

export const collapseIcon = (): JSX.Element => renderSvg("", collapseIconSvg)

export const expandIcon = (): JSX.Element => renderSvg("", expandIconSvg)

export const ladderIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, ladderIconSvg)

export const mapIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, mapIconSvg)

export const reverseIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconSvg)

export const reverseIconReversed = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconReversedSvg)

export const searchIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, searchIconSvg)

export const skateLogoIcon = (className: string = ""): JSX.Element =>
  todayIsHalloween()
    ? renderSvg(`${className} halloween`, skateLogoHalloweenIconSvg)
    : renderSvg(className, skateLogoIconSvg)

const todayIsHalloween = (): boolean => {
  const today = new Date()
  return today.getMonth() === 9 && today.getDate() === 31
}
