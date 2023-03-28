import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeInputModal } from "../state"

const InputModal = ({
  children,
}: {
  children: JSX.Element | JSX.Element[]
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <>
      <div role="dialog">
        <div
          className="m-input-modal"
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              dispatch(closeInputModal())
            }
          }}
        >
          {children}
        </div>
      </div>
      <div className="m-input-modal__backdrop" aria-hidden={true} />
    </>
  )
}

export default InputModal
