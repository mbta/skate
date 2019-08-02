import React, { useReducer, useState } from "react"

/**
 * A promise that resolves synchronously.
 */
export const instantPromise = <T>(value: T): Promise<T> =>
  ({ then: (onfulfilled: (v: T) => any) => onfulfilled(value) } as Promise<T>)

/**
 * Injects a custom state into the next call to useState by replacing its initial value.
 */
export const mockUseStateOnce = <T>(mockInitialState: T): void => {
  const actualUseState = useState
  const spyUseState = jest.spyOn(React, "useState") as jest.Mock
  spyUseState.mockImplementationOnce(() => actualUseState(mockInitialState))
}

/**
 * Injects a custom state into the next call to useReducer by replacing its initial value.
 */
export const mockUseReducerOnce = <T>(mockInitialState: T): void => {
  const actualUseReducer = useReducer
  const spyUseReducer = jest.spyOn(React, "useReducer") as jest.Mock
  spyUseReducer.mockImplementationOnce((reducer, _realInitialState) =>
    actualUseReducer(reducer, mockInitialState)
  )
}
