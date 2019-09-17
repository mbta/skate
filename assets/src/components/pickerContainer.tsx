import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { collapseIcon, expandIcon } from "../helpers/icon"
import { togglePickerContainer } from "../state"

interface Props {
  children: ReactElement<HTMLElement>
  classNameModifier?: string
}

const PickerContainer = ({
  children,
  classNameModifier,
}: Props): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const toggleVisibility = () => dispatch(togglePickerContainer())

  const classNameWithModifier =
    classNameModifier !== undefined
      ? `m-picker-container--${classNameModifier}`
      : ""

  return (
    <div
      className={`m-picker-container ${classNameWithModifier} ${
        state.pickerContainerIsVisible ? "visible" : "hidden"
      }`}
    >
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
