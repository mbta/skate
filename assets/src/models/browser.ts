import type { Socket } from "phoenix"

type DisconnectableSocket = Pick<Socket, "disconnect">

const NORMAL_CLOSE_CODE = 1000
const RELOAD_DISCONNECT_TIMEOUT_MS = 1000

const activeSockets = new Set<DisconnectableSocket>()
let reloadInFlight = false
let reloadTimeout: ReturnType<typeof setTimeout> | undefined
let reloadGeneration = 0

export const registerSocket = (socket: DisconnectableSocket): void => {
  activeSockets.add(socket)
}

export const unregisterSocket = (socket: DisconnectableSocket): void => {
  activeSockets.delete(socket)
}

export const isReloadInFlight = (): boolean => reloadInFlight

export const resetBrowserReloadState = (): void => {
  activeSockets.clear()
  clearTimeout(reloadTimeout)
  reloadTimeout = undefined
  reloadInFlight = false
  reloadGeneration += 1
}

const triggerLocationReload = (): void => {
  try {
    window.location.reload()
  } catch (err) {
    reloadInFlight = false
    throw err
  }
}

export const reload = (): void => {
  if (reloadInFlight) return
  reloadInFlight = true

  const sockets = [...activeSockets]
  if (sockets.length === 0) {
    triggerLocationReload()
    return
  }

  const generation = reloadGeneration
  let completed = false
  let remaining = sockets.length
  let dispatchingDisconnects = true

  const finishReload = () => {
    if (completed || !reloadInFlight || generation !== reloadGeneration) return
    completed = true
    clearTimeout(reloadTimeout)
    reloadTimeout = undefined
    triggerLocationReload()
  }

  for (const socket of sockets) {
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      remaining -= 1
      if (remaining === 0 && !dispatchingDisconnects) {
        finishReload()
      }
    }

    try {
      socket.disconnect(settle, NORMAL_CLOSE_CODE)
    } catch {
      settle()
    }
  }

  dispatchingDisconnects = false
  if (remaining === 0) {
    finishReload()
  } else {
    reloadTimeout = setTimeout(finishReload, RELOAD_DISCONNECT_TIMEOUT_MS)
  }
}
