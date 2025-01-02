import { Channel, Socket } from "phoenix"
import { SimpleDetour } from "../models/detoursList"
import { useEffect, useState } from "react"
import { reload } from "../models/browser"
import { userUuid } from "../util/userUuid"
import { ByRouteId, RouteId } from "../schedule"
import { equalByElements } from "../helpers/array"

export interface DetoursMap {
  [key: number]: SimpleDetour
}

const subscribe = (
  socket: Socket,
  topic: string,
  initializeChannel: React.Dispatch<React.SetStateAction<DetoursMap>>,
  handleDrafted: ((data: SimpleDetour) => void) | undefined,
  handleActivated: ((data: SimpleDetour) => void) | undefined,
  handleDeactivated: ((data: SimpleDetour) => void) | undefined
): Channel => {
  const channel = socket.channel(topic)

  handleDrafted &&
    channel.on("drafted", ({ data: data }) => handleDrafted(data))
  handleActivated &&
    channel.on("activated", ({ data: data }) => handleActivated(data))
  handleDeactivated &&
    channel.on("deactivated", ({ data: data }) => handleDeactivated(data))
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", ({ data: data }: { data: SimpleDetour[] }) => {
      const detoursMap = Object.fromEntries(data.map((v) => [v.id, v]))
      initializeChannel(detoursMap)
    })

    .receive("error", ({ reason }) => {
      if (reason === "not_authenticated") {
        reload()
      } else {
        // eslint-disable-next-line no-console
        console.error(`joining topic ${topic} failed`, reason)
      }
    })
    .receive("timeout", reload)

  return channel
}

// This is to refresh the Detours List page. We need all active detours
export const useActiveDetours = (socket: Socket | undefined) => {
  const topic = "detours:active"
  const [activeDetours, setActiveDetours] = useState<DetoursMap>({})

  const handleActivated = (data: SimpleDetour) => {
    setActiveDetours((activeDetours) => ({ ...activeDetours, [data.id]: data }))
  }

  const handleDeactivated = (data: SimpleDetour) => {
    setActiveDetours((activeDetours) => {
      delete activeDetours[data.id]
      return activeDetours
    })
  }

  useEffect(() => {
    let channel: Channel | undefined
    if (socket) {
      channel = subscribe(
        socket,
        topic,
        setActiveDetours,
        undefined,
        handleActivated,
        handleDeactivated
      )
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket])
  return activeDetours
}

// This is to refresh the Detours List page, past detours section
export const usePastDetours = (socket: Socket | undefined) => {
  const topic = "detours:past"
  const [pastDetours, setPastDetours] = useState<DetoursMap>({})

  const handleDeactivated = (data: SimpleDetour) => {
    setPastDetours((pastDetours) => ({ ...pastDetours, [data.id]: data }))
  }

  useEffect(() => {
    let channel: Channel | undefined
    if (socket) {
      channel = subscribe(
        socket,
        topic,
        setPastDetours,
        undefined,
        undefined,
        handleDeactivated
      )
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket])
  return pastDetours
}

// This is to refresh the Detours List page, just the current user drafts
export const useDraftDetours = (socket: Socket | undefined) => {
  const topic = "detours:draft:" + userUuid()
  const [draftDetours, setDraftDetours] = useState<DetoursMap>({})

  const handleDrafted = (data: SimpleDetour) => {
    setDraftDetours((draftDetours) => ({ ...draftDetours, [data.id]: data }))
  }

  const handleActivated = (data: SimpleDetour) => {
    setDraftDetours((draftDetours) => {
      delete draftDetours[data.id]
      return draftDetours
    })
  }

  useEffect(() => {
    let channel: Channel | undefined
    if (socket) {
      channel = subscribe(
        socket,
        topic,
        setDraftDetours,
        handleDrafted,
        handleActivated,
        undefined
      )
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic])
  return draftDetours
}

const subscribeByRoute = (
  socket: Socket,
  topic: string,
  routeId: string,
  setDetours: React.Dispatch<React.SetStateAction<ByRouteId<DetoursMap>>>
): Channel => {
  const channel = socket.channel(topic + routeId)

  channel.on("activated", ({ data: data }) => {
    setDetours((activeDetours) => ({
      ...activeDetours,
      [routeId]: { ...activeDetours[routeId], [data.id]: data },
    }))
  })
  channel.on("deactivated", ({ data: data }) => {
    setDetours((activeDetours) => {
      delete activeDetours[routeId][data.id]
      return activeDetours
    })
  })
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", ({ data: data }: { data: SimpleDetour[] }) => {
      const detoursMap = Object.fromEntries(data.map((v) => [v.id, v]))
      setDetours((detoursByRouteId) => ({
        ...detoursByRouteId,
        [routeId]: detoursMap,
      }))
    })

    .receive("error", ({ reason }) => {
      if (reason === "not_authenticated") {
        reload()
      } else {
        // eslint-disable-next-line no-console
        console.error(`joining topic ${topic} failed`, reason)
      }
    })
    .receive("timeout", reload)

  return channel
}

// This is to refresh the Route Ladders
export const useActiveDetoursByRoute = (
  socket: Socket | undefined,
  routeIds: RouteId[]
): ByRouteId<DetoursMap> => {
  const baseTopic = "detours:active:"
  const [activeDetoursByRoute, setActiveDetoursByRoute] = useState<
    ByRouteId<DetoursMap>
  >({})
  // eslint-disable-next-line react/hook-use-state
  const [, setChannelsByRouteId] = useState<ByRouteId<Channel>>({})

  const [currentRouteIds, setCurrentRouteIds] = useState<RouteId[]>(routeIds)

  if (!equalByElements(currentRouteIds, routeIds)) {
    setCurrentRouteIds(routeIds)
  }

  useEffect(() => {
    if (socket) {
      setChannelsByRouteId((oldChannelsByRoutId) => {
        const channelsByRouteId: ByRouteId<Channel> = {}

        Object.entries(oldChannelsByRoutId).forEach(([routeId, channel]) => {
          if (!currentRouteIds.includes(routeId)) {
            channel.leave()
          }
        })

        currentRouteIds.forEach((routeId) => {
          if (routeId in oldChannelsByRoutId) {
            channelsByRouteId[routeId] = oldChannelsByRoutId[routeId]
          } else {
            channelsByRouteId[routeId] = subscribeByRoute(
              socket,
              baseTopic,
              routeId,
              setActiveDetoursByRoute
            )
          }
        })

        return channelsByRouteId
      })
    }
  }, [socket, currentRouteIds])

  return activeDetoursByRoute
}
