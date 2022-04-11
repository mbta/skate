import React, { useReducer, useState } from "react"

/**
 * A promise that resolves synchronously.
 */
export const instantPromise = <T>(value: T): Promise<T> =>
  ({ then: (onfulfilled: (v: T) => any) => onfulfilled(value) } as Promise<T>)

/**
 * A promise that never resolves.
 */
export const neverPromise = (): Promise<any> =>
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  new Promise(() => {})

/**
 * Injects a custom state into the next call to useState by replacing its initial value.
 */
export const mockUseStateOnce = <T>(mockInitialState: T): void => {
  const actualUseState = useState
  const spyUseState = jest.spyOn(React, "useState") as jest.Mock
  spyUseState.mockImplementationOnce(() => actualUseState(mockInitialState))
}

/*
 * Like mockUseStateOnce, but for useReducer
 */
export const mockUseReducerOnce = <StateT, ActionT>(
  reducer: (state: StateT, action: ActionT) => StateT,
  mockInitialState: StateT
) => {
  const actualUseReducer = useReducer
  const spyUseReducer = jest.spyOn(React, "useReducer") as jest.Mock
  spyUseReducer.mockImplementationOnce(() =>
    actualUseReducer(reducer, mockInitialState)
  )
}
