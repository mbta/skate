import React, { useCallback, useEffect, useState } from "react"
import { DetoursTable } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { fetchDetour, fetchDetours } from "../api"
import { useApiCall } from "../hooks/useApiCall"
import { isOk } from "../util/result"
import { isValidSnapshot } from "../util/isValidSnapshot"
import { createDetourMachine } from "../models/createDetourMachine"
import { Snapshot } from "xstate"

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const [detourId, setDetourId] = useState<number | undefined>()
  const [stateOfDetourModal, setStateOfDetourModal] =
    useState<Snapshot<unknown> | null>()

  const { result } = useApiCall({
    apiCall: useCallback(async () => fetchDetours(), []),
  })
  const detours = result && isOk(result) && result.ok

  const { result: detourResult } = useApiCall({
    apiCall: useCallback(
      async () => (detourId ? fetchDetour(detourId) : undefined),
      [detourId]
    ),
  })
  const detour =
    detourResult && isOk(detourResult) ? detourResult.ok : undefined

  useEffect(() => {
    const state = isValidSnapshot(createDetourMachine, detour?.state)
    if (isOk(state)) setStateOfDetourModal(state.ok)
  }, [detour])

  const onOpenDetour = (detourId: number) => {
    setDetourId(detourId)
    setShowDetourModal(true)
  }

  const onCloseDetour = () => {
    setDetourId(undefined)
    setStateOfDetourModal(null)
    setShowDetourModal(false)
  }

  return (
    <div className="c-detour-list-page h-100 overflow-y-auto p-0 p-md-4 bg-white">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button
          className="c-detour-list-page__button icon-link fw-light px-3 py-2 u-hide-for-mobile"
          onClick={() => setShowDetourModal(true)}
        >
          <PlusSquare />
          <span className="c-detour-list-page__button-text">Add detour</span>
        </Button>
      )}
      {detours && (
        <>
          {detours.active && (
            <DetoursTable data={detours.active} onOpenDetour={onOpenDetour} />
          )}
          {detours.draft && (
            <DetoursTable data={detours.draft} onOpenDetour={onOpenDetour} />
          )}
          {detours.past && (
            <DetoursTable data={detours.past} onOpenDetour={onOpenDetour} />
          )}
        </>
      )}

      {/* Need to be separate modals to force the modal's state machine to refresh */}
      {showDetourModal && !detourId && (
        <DetourModal
          onClose={() => setShowDetourModal(false)}
          show
          originalRoute={{}}
        />
      )}

      {showDetourModal && stateOfDetourModal && (
        <DetourModal
          onClose={onCloseDetour}
          show
          originalRoute={{}}
          {...(stateOfDetourModal ? { snapshot: stateOfDetourModal } : {})}
        />
      )}
    </div>
  )
}
