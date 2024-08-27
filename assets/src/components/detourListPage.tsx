import React, { useState } from "react"
import { DetoursTable } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { useAllDetours } from "../hooks/useAllDetours"

export interface Detour {
  route: string
  direction: string
  name: string
  intersection: string
  activeSince: number
}

export const DetourListPage = () => {
  const fakeData = [
    {
      route: "45",
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      route: "83",
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      route: "83",
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
    {
      route: "45",
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      route: "83",
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      route: "83",
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
    {
      route: "45",
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      route: "83",
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      route: "83",
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
  ]

  const [showDetourModal, setShowDetourModal] = useState(false)

  const detours = useAllDetours()
  console.debug("detours: ", detours)

  return (
    <div className="h-100 overflow-y-auto">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button className="icon-link" onClick={() => setShowDetourModal(true)}>
          <PlusSquare />
          Add detour
        </Button>
      )}
      <DetoursTable data={fakeData} />
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
