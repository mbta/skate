import React, { useCallback, useState } from "react"
import { DetoursTable } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { fetchDetour, fetchDetours } from "../api"
import { useApiCall } from "../hooks/useApiCall"
import { isErr, isOk } from "../util/result"
import { isValidSnapshot } from "../util/isValidSnapshot"
import { createDetourMachine } from "../models/createDetourMachine"

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const [detourId, setDetourId] = useState<number | undefined>()
  const { result } = useApiCall({
    apiCall: useCallback(async () => fetchDetours(), []),
  })
  const detours = result && isOk(result) && result.ok
  
  const { result: stateOfDetourModal } = useApiCall({
    apiCall: useCallback(
      async () => {
        if (detourId === undefined) { return undefined }
        const detourResponse = await fetchDetour(detourId)
        if (isErr(detourResponse)) { return undefined }
        const snapshot = isValidSnapshot(createDetourMachine, detourResponse.ok.state)
        if (isErr(snapshot)) { return undefined }
        return snapshot.ok
      },
      [detourId]
    ),
  })

  const onOpenDetour = (detourId: number) => {
    setDetourId(detourId)
    setShowDetourModal(true)
  }

  const onCloseDetour = () => {
    setDetourId(undefined)
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

      {showDetourModal && (!detourId || stateOfDetourModal) && (
        <DetourModal
          onClose={onCloseDetour}
          show
          originalRoute={{}}
          key={detourId ?? ""}
          {...(stateOfDetourModal ? { snapshot: stateOfDetourModal } : {})}
        />
      )}
    </div>
  )
}
