import { useState } from "react"
import { now } from "../util/dateTime"
import useInterval from "./useInterval"

export const useCurrentTime = (): Date => {
  const [currentTime, setCurrentTime] = useState(now())
  useInterval(() => setCurrentTime(now()), 1000)
  return currentTime
}

const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

export const useCurrentTimeSeconds = (): number => {
  const [epochNowInSeconds, setEpochNowInSeconds] = useState(nowInSeconds())
  useInterval(() => setEpochNowInSeconds(nowInSeconds()), 1000)
  return epochNowInSeconds
}

export default useCurrentTime
