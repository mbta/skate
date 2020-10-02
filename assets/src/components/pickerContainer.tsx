import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { collapseIcon, expandIcon } from "../helpers/icon"
import {
  askPermission,
  browserSupportsPush,
  subscribeUserToPush,
} from "../pushSpike"

import { togglePickerContainer } from "../state"

interface Props {
  children: ReactElement<HTMLElement>
  width?: Width
}

export enum Width {
  Narrow = 1,
  Wide,
}

const triggerPush = () => {
  if (browserSupportsPush()) {
    if (askPermission()) {
      subscribeUserToPush()
    }
  }
}

const PickerContainer = ({
  children,
  width,
}: Props): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const toggleVisibility = () => dispatch(togglePickerContainer())

  const widthClassModifier =
    width === Width.Wide
      ? "m-picker-container--wide"
      : "m-picker-container--narrow"

  return (
    <div
      className={`m-picker-container ${widthClassModifier} ${
        state.pickerContainerIsVisible ? "visible" : "hidden"
      }`}
    >
      <button onClick={triggerPush}>CLICK ME FOR A SURPRISE</button>
      <Tab
        isVisible={state.pickerContainerIsVisible}
        toggleVisibility={toggleVisibility}
      />
      {children}
    </div>
  )
}

const Tab = ({
  isVisible,
  toggleVisibility,
}: {
  isVisible: boolean
  toggleVisibility: () => void
}) => (
  <div className="m-picker-container__tab">
    <button
      className="m-picker-container__tab-button"
      onClick={toggleVisibility}
    >
      {isVisible ? collapseIcon() : expandIcon()}
    </button>
  </div>
)

export default PickerContainer
