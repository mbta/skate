// @ts-ignore
import blueLineIconSvg from "../../static/images/icon-blue-line.svg"
// @ts-ignore
import collapseIconSvg from "../../static/images/icon-caret-left.svg"
// @ts-ignore
import expandIconSvg from "../../static/images/icon-caret-right.svg"
// @ts-ignore
import circleXIconSvg from "../../static/images/icon-circle-x.svg"
// @ts-ignore
import closeIconSvg from "../../static/images/icon-close-x.svg"
// @ts-ignore
import commuterRailIconSvg from "../../static/images/icon-commuter-rail.svg"
// @ts-ignore
import greenLineBIconSvg from "../../static/images/icon-green-line-b.svg"
// @ts-ignore
import greenLineCIconSvg from "../../static/images/icon-green-line-c.svg"
// @ts-ignore
import greenLineDIconSvg from "../../static/images/icon-green-line-d.svg"
// @ts-ignore
import greenLineEIconSvg from "../../static/images/icon-green-line-e.svg"
// @ts-ignore
import greenLineIconSvg from "../../static/images/icon-green-line.svg"
// @ts-ignore
import ladderIconSvg from "../../static/images/icon-ladder.svg"
// @ts-ignore
import mapIconSvg from "../../static/images/icon-map.svg"
// @ts-ignore
import mattapanLineIconSvg from "../../static/images/icon-mattapan-line.svg"
// @ts-ignore
import orangeLineIconSvg from "../../static/images/icon-orange-line.svg"
// @ts-ignore
import redLineIconSvg from "../../static/images/icon-red-line.svg"
// @ts-ignore
import refreshIconSvg from "../../static/images/icon-refresh.svg"
// @ts-ignore
import reverseIconSvg from "../../static/images/icon-reverse-normal.svg"
// @ts-ignore
import reverseIconReversedSvg from "../../static/images/icon-reverse-reversed.svg"
// @ts-ignore
import searchIconSvg from "../../static/images/icon-search.svg"
import renderSvg from "./renderSvg"

export const blueLineIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, blueLineIconSvg)

export const circleXIcon = (): JSX.Element => renderSvg("", circleXIconSvg)

export const closeIcon = (): JSX.Element => renderSvg("", closeIconSvg)

export const collapseIcon = (): JSX.Element => renderSvg("", collapseIconSvg)

export const commuterRailIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, commuterRailIconSvg)

export const expandIcon = (): JSX.Element => renderSvg("", expandIconSvg)

export const greenLineBIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, greenLineBIconSvg)

export const greenLineCIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, greenLineCIconSvg)

export const greenLineDIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, greenLineDIconSvg)

export const greenLineEIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, greenLineEIconSvg)

export const greenLineIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, greenLineIconSvg)

export const ladderIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, ladderIconSvg)

export const mapIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, mapIconSvg)

export const mattapanLineIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, mattapanLineIconSvg)

export const orangeLineIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, orangeLineIconSvg)

export const redLineIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, redLineIconSvg)

export const refreshIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, refreshIconSvg)

export const reverseIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconSvg)

export const reverseIconReversed = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconReversedSvg)

export const searchIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, searchIconSvg)
