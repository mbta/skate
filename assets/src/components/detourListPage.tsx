import React, { useState } from "react"
import { DetoursTable } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { useAllDetours } from "../hooks/useAllDetours"

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const detours = useAllDetours()

  return (
    <div className="h-100 overflow-y-auto">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button className="icon-link" onClick={() => setShowDetourModal(true)}>
          <PlusSquare />
          Add detour
        </Button>
      )}
      {detours && (
        <>
          {detours.active && <DetoursTable data={detours.active} />}
          {detours.draft && <DetoursTable data={detours.draft} />}
          {detours.past && <DetoursTable data={detours.past} />}
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
