/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import alertIconSvg from "../../static/images/icon-alert.svg"
// @ts-ignore
import bangIconSvg from "../../static/images/icon-bang.svg"
// @ts-ignore
import blueLineIconSvg from "../../static/images/icon-blue-line.svg"
// @ts-ignore
import busFrontIconSvg from "../../static/images/icon-bus-front.svg"
// @ts-ignore
import busRearIconSvg from "../../static/images/icon-bus-rear.svg"
// @ts-ignore
import chevronLeftIconSvg from "../../static/images/icon-chevron-left.svg"
// @ts-ignore
import closeXIconSvg from "../../static/images/icon-close-x.svg"
// @ts-ignore
import collapseIconSvg from "../../static/images/icon-caret-left.svg"
// @ts-ignore
import doubleChevronLeftIconSvg from "../../static/images/icon-double-chevron-left.svg"
// @ts-ignore
import doubleChevronRightIconSvg from "../../static/images/icon-double-chevron-right.svg"
// @ts-ignore
import expandIconSvg from "../../static/images/icon-caret-right.svg"
// @ts-ignore
import circleXIconSvg from "../../static/images/icon-circle-x.svg"
// @ts-ignore
import commuterRailIconSvg from "../../static/images/icon-commuter-rail.svg"
// @ts-ignore
import crowdingIconSvg from "../../static/images/icon-crowding.svg"
// @ts-ignore
import ellipsisIconSvg from "../../static/images/icon-ellipsis.svg"
// @ts-ignore
import filledCircleIconSvg from "../../static/images/icon-filled-circle.svg"
// @ts-ignore
import ghostIconSvg from "../../static/images/icon-ghost.svg"
// @ts-ignore
import ghostSwingIconSvg from "../../static/images/icon-ghost-swing.svg"
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
import hamburgerIconSvg from "../../static/images/icon-hamburger.svg"
// @ts-ignore
import hiddenIconSvg from "../../static/images/icon-hidden.svg"
// @ts-ignore
import ladderIconSvg from "../../static/images/icon-ladder.svg"
// @ts-ignore
import lateIconSvg from "../../static/images/icon-late.svg"
// @ts-ignore
import lateViewGhostIconSvg from "../../static/images/icon-late-view-ghost.svg"
// @ts-ignore
import lateViewGhostWithWaiverIconSvg from "../../static/images/icon-late-view-ghost-with-waiver.svg"
// @ts-ignore
import loadingIconSvg from "../../static/images/icon-loading.svg"
// @ts-ignore
import logoIconSvg from "../../static/images/icon-logo.svg"
// @ts-ignore
import mapIconSvg from "../../static/images/icon-map.svg"
// @ts-ignore
import mattapanLineIconSvg from "../../static/images/icon-mattapan-line.svg"
// @ts-ignore
import minusIconSvg from "../../static/images/icon-minus.svg"
// @ts-ignore
import notificationBellIconSvg from "../../static/images/icon-notification-bell.svg"
// @ts-ignore
import oldCloseIconSvg from "../../static/images/icon-old-close-x.svg"
// @ts-ignore
import orangeLineIconSvg from "../../static/images/icon-orange-line.svg"
// @ts-ignore
import plusIconSvg from "../../static/images/icon-plus.svg"
// @ts-ignore
import plusThinIconSvg from "../../static/images/icon-plus-thin.svg"
// @ts-ignore
import questionMarkIconSvg from "../../static/images/icon-question-mark.svg"
// @ts-ignore
import redLineIconSvg from "../../static/images/icon-red-line.svg"
// @ts-ignore
import refreshIconSvg from "../../static/images/icon-refresh.svg"
// @ts-ignore
import reverseIconSvg from "../../static/images/icon-reverse-normal.svg"
// @ts-ignore
import reverseIconReversedSvg from "../../static/images/icon-reverse-reversed.svg"
// @ts-ignore
import saveIconSvg from "../../static/images/icon-save.svg"
// @ts-ignore
import searchIconSvg from "../../static/images/icon-search.svg"
// @ts-ignore
import settingsIconSvg from "../../static/images/icon-settings.svg"
// @ts-ignore
import speechBubbleIconSvg from "../../static/images/icon-speech-bubble.svg"
// @ts-ignore
import swingIconSvg from "../../static/images/icon-swing.svg"
// @ts-ignore
import toggleOffIconSvg from "../../static/images/icon-toggle-off.svg"
// @ts-ignore
import toggleOnIconSvg from "../../static/images/icon-toggle-on.svg"
// @ts-ignore
import triangleDownIconSvg from "../../static/images/icon-triangle-down.svg"
// @ts-ignore
import triangleUpIconSvg from "../../static/images/icon-triangle-up.svg"
// @ts-ignore
import triangleUpLargeIconSvg from "../../static/images/icon-triangle-up-large.svg"
// @ts-ignore
import unhiddenIconSvg from "../../static/images/icon-unhidden.svg"
// @ts-ignore
import unreadIconSvg from "../../static/images/icon-unread.svg"
// @ts-ignore
import upDownIconSvg from "../../static/images/icon-up-down-arrow.svg"
// @ts-ignore
import upRightIconSvg from "../../static/images/icon-up-right-arrow.svg"
// @ts-ignore
import walkingIconSvg from "../../static/images/icon-walking.svg"

/* eslint-enable @typescript-eslint/ban-ts-comment */
import renderSvg from "./renderSvg"

const iconFn = (svgText: string) => (className = ""): JSX.Element =>
  renderSvg(className, svgText)

export const alertIcon = iconFn(alertIconSvg)
export const bangIcon = iconFn(bangIconSvg)

export const blueLineIcon = iconFn(blueLineIconSvg)

export const busFrontIcon = iconFn(busFrontIconSvg)

export const busRearIcon = iconFn(busRearIconSvg)

export const chevronLeftIcon = iconFn(chevronLeftIconSvg)

export const circleXIcon = iconFn(circleXIconSvg)

export const closeXIcon = iconFn(closeXIconSvg)

export const collapseIcon = iconFn(collapseIconSvg)

export const doubleChevronLeftIcon = iconFn(doubleChevronLeftIconSvg)

export const doubleChevronRightIcon = iconFn(doubleChevronRightIconSvg)

export const commuterRailIcon = iconFn(commuterRailIconSvg)

export const crowdingIcon = iconFn(crowdingIconSvg)

export const ellipsisIcon = iconFn(ellipsisIconSvg)

export const expandIcon = iconFn(expandIconSvg)

export const filledCircleIcon = iconFn(filledCircleIconSvg)

export const ghostIcon = iconFn(ghostIconSvg)

export const ghostSwingIcon = iconFn(ghostSwingIconSvg)

export const greenLineBIcon = iconFn(greenLineBIconSvg)

export const greenLineCIcon = iconFn(greenLineCIconSvg)

export const greenLineDIcon = iconFn(greenLineDIconSvg)

export const greenLineEIcon = iconFn(greenLineEIconSvg)

export const greenLineIcon = iconFn(greenLineIconSvg)

export const hamburgerIcon = iconFn(hamburgerIconSvg)

export const hiddenIcon = iconFn(hiddenIconSvg)

export const ladderIcon = iconFn(ladderIconSvg)

export const lateIcon = iconFn(lateIconSvg)

export const lateViewGhostIcon = iconFn(lateViewGhostIconSvg)

export const lateViewGhostWithWaiverIcon = iconFn(lateViewGhostWithWaiverIconSvg)

export const loadingIcon = iconFn(loadingIconSvg)

export const logoIcon = iconFn(logoIconSvg)

export const mapIcon = iconFn(mapIconSvg)

export const mattapanLineIcon = iconFn(mattapanLineIconSvg)

export const minusIcon = iconFn(minusIconSvg)

export const notificationBellIcon = iconFn(notificationBellIconSvg)

export const oldCloseIcon = iconFn(oldCloseIconSvg)

export const orangeLineIcon = iconFn(orangeLineIconSvg)

export const plusIcon = iconFn(plusIconSvg)

export const plusThinIcon = iconFn(plusThinIconSvg)

export const questionMarkIcon = iconFn(questionMarkIconSvg)

export const redLineIcon = iconFn(redLineIconSvg)

export const refreshIcon = iconFn(refreshIconSvg)

export const reverseIcon = iconFn(reverseIconSvg)

export const reverseIconReversed = iconFn(reverseIconReversedSvg)

export const saveIcon = iconFn(saveIconSvg)

export const searchIcon = iconFn(searchIconSvg)

export const settingsIcon = iconFn(settingsIconSvg)

export const speechBubbleIcon = iconFn(speechBubbleIconSvg)

export const swingIcon = iconFn(swingIconSvg)

export const toggleOffIcon = iconFn(toggleOffIconSvg)

export const toggleOnIcon = iconFn(toggleOnIconSvg)

export const triangleDownIcon = iconFn(triangleDownIconSvg)

export const triangleUpIcon = iconFn(triangleUpIconSvg)

export const triangleUpLargeIcon = iconFn(triangleUpLargeIconSvg)

export const unhiddenIcon = iconFn(unhiddenIconSvg)

export const unreadIcon = iconFn(unreadIconSvg)

export const upDownIcon = iconFn(upDownIconSvg)

export const upRightIcon = iconFn(upRightIconSvg)

export const walkingIcon = iconFn(walkingIconSvg)
