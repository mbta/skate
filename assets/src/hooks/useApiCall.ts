import { useEffect, useState } from "react"

/**
 * Return type of {@linkcode useApiCall}
 */
interface ApiLoadingResult<T> {
  /**
   * Indicates if {@linkcode useApiCall} is in the process of computing a new
   * value
   */
  isLoading: boolean

  /**
   * The last value that {@linkcode useApiCall} resolved.
   *
   * Is `undefined` when it has not resolved or it resolves to `undefined`
   */
  result: T | undefined
}

/** Hook prop arguments for {@linkcode useApiCall} */
interface UseApiCallProps<T> {
  /**
   * Function which returns a promise that is called every time it changes.
   * @param abortSignal An {@linkcode AbortSignal} that signals if the promise
   *    should attempt to cancel early
   */
  apiCall: (abortSignal: AbortSignal) => Promise<undefined | T>
}

/**
 * Calls the provided function returning a {@linkcode Promise} and tracks the
 * loading state and the previously resolved value.
 *
 * @returns {ApiLoadingResult<T>}
 */
export const useApiCall = <T>({
  apiCall,
}: UseApiCallProps<T>): ApiLoadingResult<T> => {
  const [apiResult, setApiResult] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const controller = new AbortController()

    setIsLoading(true)
    apiCall(controller.signal).then((value) => {
      if (controller.signal.aborted) {
        return
      }

      setApiResult(value)
      setIsLoading(false)
    })
    .catch((reason) => {
      setIsLoading(false)
      throw reason
    })

    return () => {
      controller.abort()
    }
  }, [apiCall, setApiResult, setIsLoading])

  return {
    isLoading,
    result: apiResult,
  }
}
