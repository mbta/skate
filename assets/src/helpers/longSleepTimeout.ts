// The standard-issue Android tablets that Skate runs on have an upper limit
// on how long you can make the screen-sleep timeout that we consider too
// short. The NoSleep library uses clever hacks to disable the timeout
// entirely, but we don't want the tablets to stay awake indefinitely, just
// for a longer timeout of our choosing. That's what we implement here.
//
import NoSleep from "nosleep.js"

// Notice that this extends the existing timeout: that is, if the tablet's
// built-in sleep timeout is 10 minutes, and we call extendSleepTimeout(20),
// the effective sleep timeout will be roughly 30 minutes.
//
export const extendSleepTimeout = (sleepTimeoutInMins: number) => {
  const sleepTimeoutInMs = sleepTimeoutInMins * 60 * 1000
  const sleepCheckIntervalInMs = 15000

  const noSleep = new NoSleep()
  let noSleepEnabled = false
  let lastInteractionAt = Date.now()

  const resetSleepTimeout = () => {
    lastInteractionAt = Date.now()
    if (!noSleepEnabled) {
      noSleepEnabled = true
      noSleep.enable()
    }
  }

  document.addEventListener("touchstart", resetSleepTimeout, false)
  document.addEventListener("mousemove", resetSleepTimeout, false)
  document.addEventListener("keydown", resetSleepTimeout, false)

  const checkForSleepTimeout = () => {
    const timeSinceLastInteraction = Date.now() - lastInteractionAt
    if (timeSinceLastInteraction >= sleepTimeoutInMs) {
      noSleepEnabled = false
      noSleep.disable()
    }
  }

  window.setInterval(checkForSleepTimeout, sleepCheckIntervalInMs)
}
