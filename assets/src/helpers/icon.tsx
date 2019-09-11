import React from "react"

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

export const ladderIcon = (className: string = ""): JSX.Element => (
  <svg
    viewBox="0 0 48 48"
    width="24"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className={className}
      d="m32.73 39.86v-12.08a4.37 4.37 0 0 1 0-7.56v-12.08a4.36 4.36 0 1 1 4.36 0v12.08a4.37 4.37 0 0 1 0 7.56v12.08a4.36 4.36 0 1 1 -4.36 0zm-17.46 0a4.36 4.36 0 1 1 -4.36 0v-12.08a4.37 4.37 0 0 1 0-7.56v-12.08a4.36 4.36 0 1 1 4.36 0v12.08a4.37 4.37 0 0 1 0 7.56z"
    />
  </svg>
)

export const mapIcon = (className: string = ""): JSX.Element => (
  <svg
    width="24"
    height="22"
    viewBox="0 0 24 22"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className={className}
      d="M23,0 C23.5522847,0 24,0.44771525 24,1 L24,21 C24,21.5522847 23.5522847,22 23,22 L1,22 C0.44771525,22 0,21.5522847 0,21 L0,1 C0,0.44771525 0.44771525,0 1,0 L23,0 Z M1,1.029 L1,21 L2.235,21 L8.54273969,3.6527516 L1,1.029 Z M9.37373969,13.0727516 L6.491,21 L23,21 L23,18.71 L9.37373969,13.0727516 Z M23,2.589 L18.6237397,13.6527516 L23,15.463 L23,2.589 Z M22.756,1 L13.764,1 L12.6627397,4.0277516 L12.6642603,4.0277516 L12.3357397,4.9722484 L12.3207397,4.9667516 L10.3997397,10.2507516 L17.8737397,13.3427516 L22.756,1 Z M9.507,1 L3.962,1 L8.88473969,2.7127516 L9.507,1 Z"
    />
  </svg>
)

export const reverseIcon = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconSvg)

export const reverseIconReversed = (className: string = ""): JSX.Element =>
  renderSvg(className, reverseIconReversedSvg)
