import { Channel, Socket } from "phoenix"
import {
  ActivatedDetourData,
  SimpleDetour,
  SimpleDetourData,
  simpleDetourFromActivatedData,
  simpleDetourFromData,
} from "../models/detoursList"
import { useEffect, useState } from "react"
import { reload } from "../models/browser"
import { userUuid } from "../util/userUuid"
import { ByRouteId, RouteId } from "../schedule"
import { equalByElements } from "../helpers/array"
import { array, create } from "superstruct"

export interface DetoursMap {
  [key: number]: SimpleDetour
}

const subscribe = (
  socket: Socket,
  topic: string,
  initializeChannel: React.Dispatch<React.SetStateAction<DetoursMap | null>>,
  handleDrafted: ((data: SimpleDetour) => void) | undefined,
  handleActivated: ((data: SimpleDetour) => void) | undefined,
  handleDeactivated: ((data: SimpleDetour) => void) | undefined,
  handleDeleted: ((detourId: number) => void) | undefined,
  initialMessageType: typeof SimpleDetourData | typeof ActivatedDetourData
): Channel => {
  const channel = socket.channel(topic)

  handleDrafted &&
    channel.on("drafted", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, SimpleDetourData)
      handleDrafted(simpleDetourFromData(data))
    })
  handleActivated &&
    channel.on("activated", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, ActivatedDetourData)
      handleActivated(simpleDetourFromActivatedData(data))
    })
  handleDeactivated &&
    channel.on("deactivated", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, SimpleDetourData)
      handleDeactivated(simpleDetourFromData(data))
    })
  handleDeleted &&
    channel.on("deleted", ({ data: detourId }: { data: unknown }) => {
      if (typeof detourId === "number") {
        handleDeleted(detourId)
      }
    })
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", ({ data: unknownData }: { data: unknown }) => {
      const data = (() => {
        switch (initialMessageType) {
          case ActivatedDetourData: {
            return create(unknownData, array(ActivatedDetourData)).map(
              simpleDetourFromActivatedData
            )
          }
          case SimpleDetourData:
          default: {
            return create(unknownData, array(SimpleDetourData)).map(
              simpleDetourFromData
            )
          }
        }
      })()

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
export const useActiveDetours = (
  socket: Socket | undefined,
  enable: boolean = true
) => {
  const topic = "detours:active"
  const [activeDetours, setActiveDetours] = useState<DetoursMap | null>(null)

  const handleActivated = (data: SimpleDetour) => {
    setActiveDetours((activeDetours) => ({ ...activeDetours, [data.id]: data }))
  }

  const handleDeactivated = (data: SimpleDetour) => {
    setActiveDetours((activeDetours) => {
      if (activeDetours) delete activeDetours[data.id]
      return activeDetours
    })
  }

  useEffect(() => {
    if (enable === false) {
      return
    }

    let channel: Channel | undefined
    if (socket) {
      channel = subscribe(
        socket,
        topic,
        setActiveDetours,
        undefined,
        handleActivated,
        handleDeactivated,
        undefined,
        ActivatedDetourData
      )
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, enable])
  return activeDetours
}

// This is to refresh the Detours List page, past detours section
export const usePastDetours = (socket: Socket | undefined) => {
  const topic = "detours:past"
  const [pastDetours, setPastDetours] = useState<DetoursMap | null>(null)

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
        handleDeactivated,
        undefined,
        SimpleDetourData
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
  const [draftDetours, setDraftDetours] = useState<DetoursMap | null>(null)

  const handleDrafted = (data: SimpleDetour) => {
    setDraftDetours((draftDetours) => ({ ...draftDetours, [data.id]: data }))
  }

  const handleActivated = (data: SimpleDetour) => {
    setDraftDetours((draftDetours) => {
      if (draftDetours) delete draftDetours[data.id]
      return draftDetours
    })
  }

  const handleDeleted = (detourId: number) => {
    setDraftDetours((draftDetours) => {
      if (draftDetours) delete draftDetours[detourId]
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
        undefined,
        handleDeleted,
        SimpleDetourData
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

  channel.on("activated", ({ data: unknownData }: { data: unknown }) => {
    const data = create(unknownData, ActivatedDetourData)
    setDetours((activeDetours) => ({
      ...activeDetours,
      [routeId]: {
        ...activeDetours[routeId],
        [data.details.id]: simpleDetourFromActivatedData(data),
      },
    }))
  })
  channel.on("deactivated", ({ data: unknownData }: { data: unknown }) => {
    const data = create(unknownData, SimpleDetourData)
    setDetours((activeDetours) => {
      delete activeDetours[routeId][data.id]
      return activeDetours
    })
  })
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, array(ActivatedDetourData))
      const detoursMap = Object.fromEntries(
        data.map((v) => [v.details.id, simpleDetourFromActivatedData(v)])
      )
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
