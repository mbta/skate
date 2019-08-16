// Taken with permission from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
import { useEffect, useRef } from "react"

type Callback = () => void
const nullCallback: Callback = () => ({})

const useInterval = (callback: Callback, delay: number | null) => {
  const savedCallback = useRef<Callback>(nullCallback)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    const tick = () => savedCallback.current()

    if (delay !== null) {
      const intervalId = setInterval(tick, delay)
      return () => clearInterval(intervalId)
    }

    return () => ({})
  }, [delay])
}

export default useInterval
