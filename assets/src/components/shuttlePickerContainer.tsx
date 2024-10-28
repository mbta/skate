import React, { ReactElement, useContext } from "react"
import DrawerTab from "../components/drawerTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import { togglePickerContainer } from "../state"

interface Props {
  children: ReactElement<HTMLElement>
}

const ShuttlePickerContainer = ({
  children,
}: Props): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const toggleVisibility = () => dispatch(togglePickerContainer())

  return (
    <div
      className={joinClasses([
        "c-shuttle-picker-container",
        ...(state.pickerContainerIsVisible
          ? ["c-shuttle-picker-container--visible"]
          : ["c-shuttle-picker-container--hidden", "u-hideable--hidden"]),
      ])}
      data-testid="shuttle-picker-container"
    >
      <DrawerTab
        isVisible={state.pickerContainerIsVisible}
        toggleVisibility={toggleVisibility}
      />
      {children}
    </div>
  )
}

export default ShuttlePickerContainer
