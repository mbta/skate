import React, { ReactElement, useContext } from "react"
import DrawerTab from "../components/drawerTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import { togglePickerContainer } from "../state"

interface Props {
  children: ReactElement<HTMLElement>
}

const PickerContainer = ({ children }: Props): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const toggleVisibility = () => dispatch(togglePickerContainer())

  return (
    <>
      <div
        className={joinClasses([
          "c-picker-container",
          ...(state.pickerContainerIsVisible
            ? ["c-picker-container--visible"]
            : ["c-picker-container--hidden", "u-hideable--hidden"]),
        ])}
        data-testid="picker-container"
      >
        <DrawerTab
          isVisible={state.pickerContainerIsVisible}
          toggleVisibility={toggleVisibility}
        />
        {children}
      </div>
      {state.pickerContainerIsVisible ? (
        <div
          className="c-picker-container-backdrop"
          onClick={toggleVisibility}
          data-testid="picker-container-backdrop"
          aria-hidden={true}
        />
      ) : null}
    </>
  )
}

export default PickerContainer
