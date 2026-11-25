import { Socket } from "phoenix"
import * as browser from "../models/browser"

export const NORMAL_SOCKET_CLOSE_CODE = 1000
export const DISCONNECT_TIMEOUT_MS = 1000

const activeSockets = new Set<Socket>()
let reloadInFlight = false
let fallbackTimer: ReturnType<typeof setTimeout> | undefined

export const registerSocket = (socket: Socket): void => {
  activeSockets.add(socket)
}

export const unregisterSocket = (socket: Socket): void => {
  activeSockets.delete(socket)
}

export const isReloadInFlight = (): boolean => reloadInFlight

export const resetSocketLifecycle = (): void => {
  if (fallbackTimer !== undefined) {
    clearTimeout(fallbackTimer)
    fallbackTimer = undefined
  }
  activeSockets.clear()
  reloadInFlight = false
}

export const disconnectAndReload = (socket?: Socket | null): void => {
  if (reloadInFlight) {
    return
  }

  const candidateSockets = Array.from(
    new Set([...activeSockets, ...(socket ? [socket] : [])])
  )

  const disconnectableSockets = candidateSockets.filter(
    (candidate): candidate is Socket =>
      Boolean(candidate) && typeof candidate.disconnect === "function"
  )

  if (disconnectableSockets.length === 0) {
    browser.reload()
    return
  }

  reloadInFlight = true
  let finished = false
  let remaining = disconnectableSockets.length

  const finishReload = () => {
    if (finished || !reloadInFlight) {
      return
    }
    finished = true
    if (fallbackTimer !== undefined) {
      clearTimeout(fallbackTimer)
      fallbackTimer = undefined
    }
    reloadInFlight = false
    browser.reload()
  }

  fallbackTimer = setTimeout(finishReload, DISCONNECT_TIMEOUT_MS)

  disconnectableSockets.forEach((targetSocket) => {
    let socketDone = false
    const markSocketDone = () => {
      if (socketDone) {
        return
      }
      socketDone = true
      remaining -= 1
      if (remaining === 0) {
        finishReload()
      }
    }

    try {
      targetSocket.disconnect(markSocketDone, NORMAL_SOCKET_CLOSE_CODE)
    } catch {
      markSocketDone()
    }
  })
}
