import React, { useCallback, useState } from "react"
import { DraftDetoursTable } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { useApiCall } from "../hooks/useApiCall"
import { fetchDraftDetours } from "../api"
import { isOk } from "../util/result"

export interface Detour {
  route: string
  direction: string
  name: string
  intersection: string
  activeSince: number
}

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)

  const { result: draftDetours } = useApiCall({
    apiCall: useCallback(async () => {
      return fetchDraftDetours()
    }, []),
  })

  return (
    <div className="h-100 overflow-y-auto">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button className="icon-link" onClick={() => setShowDetourModal(true)}>
          <PlusSquare />
          Add detour
        </Button>
      )}
      {draftDetours && isOk(draftDetours) && (
        <DraftDetoursTable data={draftDetours.ok} />
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
