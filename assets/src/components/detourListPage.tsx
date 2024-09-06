import React, { useCallback, useState } from "react"
import { DetoursTable, DetourStatus } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { fetchDetours } from "../api"
import { useApiCall } from "../hooks/useApiCall"
import { isOk } from "../util/result"

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)

  const { result } = useApiCall({
    apiCall: useCallback(async () => fetchDetours(), []),
  })
  const detours = result && isOk(result) && result.ok

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
          <DetoursTable data={detours.active} status={DetourStatus.Active} />
          <DetoursTable data={detours.draft} status={DetourStatus.Draft} />
          <DetoursTable data={detours.past} status={DetourStatus.Closed} />
        </>
      )}

      {showDetourModal && (
        <DetourModal
          onClose={() => setShowDetourModal(false)}
          show
          originalRoute={{}}
        />
      )}
    </div>
  )
}
