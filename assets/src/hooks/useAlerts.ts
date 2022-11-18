import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import { array, assert, object, string } from "superstruct"
import { equalByElements } from "../helpers/array"
import { reload } from "../models/browser"
import { ByRouteId, RouteId } from "../schedule"

const subscribe = (
  socket: Socket,
  routeId: RouteId,
  updateAlerts: React.Dispatch<React.SetStateAction<ByRouteId<string[]>>>
): Channel => {
  const handleAlerts = (alertsData: unknown): void => {
    assert(
      alertsData,
      object({
        data: array(string()),
      })
    )

    updateAlerts((oldAlerts) => {
      const newAlerts: ByRouteId<string[]> = {
        [routeId]: alertsData.data,
        ...oldAlerts,
      }

      return newAlerts
    })
  }

  const topic = `alerts:route:${routeId}`
  const channel = socket.channel(topic)

  channel.on("alerts", handleAlerts)

  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", handleAlerts)
    // eslint-disable-next-line no-console
    .receive("error", ({ reason }) => console.error("join failed", reason))
    .receive("timeout", reload)

  return channel
}

const useAlerts = (
  socket: Socket | undefined,
  routeIds: RouteId[]
): ByRouteId<string[]> => {
  const [alertsByRoute, setAlertsByRoute] = useState<ByRouteId<string[]>>({})
  // eslint-disable-next-line react/hook-use-state
  const [, setChannelsByRouteId] = useState<ByRouteId<Channel>>({})

  const [currentRouteIds, setCurrentRouteIds] = useState<RouteId[]>(routeIds)

  if (!equalByElements(currentRouteIds, routeIds)) {
    setCurrentRouteIds(routeIds)
  }

  useEffect(() => {
    if (socket) {
      setChannelsByRouteId((oldChannelsByRouteId) => {
        const newChannelsByRouteId: ByRouteId<Channel> = {}

        Object.entries(oldChannelsByRouteId).forEach(([routeId, channel]) => {
          if (currentRouteIds.includes(routeId)) {
            newChannelsByRouteId[routeId] = channel
          } else {
            channel.leave()
          }
        })

        currentRouteIds.forEach((routeId) => {
          const channel = subscribe(socket, routeId, setAlertsByRoute)

          newChannelsByRouteId[routeId] = channel
        })

        return newChannelsByRouteId
      })
    }
  }, [socket, currentRouteIds])

  return alertsByRoute
}

export default useAlerts
