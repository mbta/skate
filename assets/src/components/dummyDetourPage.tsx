import React, { useEffect, useMemo, useState } from "react"
import { fetchRoutePatterns } from "../api"
import { RoutePattern } from "../schedule"
import { DiversionPage } from "./detours/diversionPage"
import { useRoute } from "../contexts/routesContext"
import { createDetourMachine } from "../models/createDetourMachine"
import { reload } from "../models/browser"
import { isOk, Err } from "../util/result"
import { isValidSnapshot } from "../util/isValidSnapshot"

export const DummyDetourPage = () => {
  const [routePattern, setRoutePattern] = useState<RoutePattern | null>(null)

  const routeNumber = "66"

  useEffect(() => {
    fetchRoutePatterns(routeNumber).then((routePatterns) => {
      setRoutePattern(routePatterns[0])
    })
  }, [])
  const route = useRoute(routePattern?.routeId)

  // The state machine won't "reinitialize", if it's inputs change, so only
  // compute the snapshot from `localStorage` once.
  const snapshot = useMemo(() => {
    const snapshot_string = localStorage.getItem("snapshot")

    if (!snapshot_string) {
      return Err<"No Snapshot Present">("No Snapshot Present")
    }

    let persisted_snapshot
    try {
      persisted_snapshot = JSON.parse(snapshot_string)
    } catch (error) {
      return Err<"Parsing JSON Failed">("Parsing JSON Failed")
    }

    return isValidSnapshot(createDetourMachine, persisted_snapshot)
  }, [])

  return (
    <>
      {isOk(snapshot) ? (
        <DiversionPage
          snapshot={snapshot.ok}
          showConfirmCloseModal={false}
          onClose={() => {
            // If the close button is clicked,
            // clear snapshot from storage and reinitialize state machine
            localStorage.setItem("snapshot", "")
            reload()
          }}
        />
      ) : (
        <>
          {
            /* temp: since this is an internal page, show snapshot error as text
             */
            snapshot.err
          }
          {route && routePattern && routePattern.shape && (
            <DiversionPage
              originalRoute={{
                center: { lat: 42.36, lng: -71.13 },
                zoom: 16,
                route,
                routePattern,
              }}
              showConfirmCloseModal={false}
              onClose={() => {}}
            />
          )}
        </>
      )}
    </>
  )
}
