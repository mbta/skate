import React, { useCallback, useState } from "react"
import { DetoursTable, DetourStatus } from "./detoursTable"
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
    apiCall: useCallback(async () => {
      if (detourId === undefined) {
        return undefined
      }
      const detourResponse = await fetchDetour(detourId)
      if (isErr(detourResponse)) {
        return undefined
      }
      const snapshot = isValidSnapshot(
        createDetourMachine,
        detourResponse.ok.state
      )
      if (isErr(snapshot)) {
        return undefined
      }
      return snapshot.ok
    }, [detourId]),
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
          <Title title="Active detours" />
          <DetoursTable
            data={detours.active}
            status={DetourStatus.Active}
            onOpenDetour={onOpenDetour}
            classNames={["mb-5"]}
          />
          <Title title="Draft detours" />
          <DetoursTable
            data={detours.draft}
            status={DetourStatus.Draft}
            onOpenDetour={onOpenDetour}
            classNames={["mb-5"]}
          />
          <Title title="Closed detours" />
          <DetoursTable
            data={detours.past}
            status={DetourStatus.Closed}
            onOpenDetour={onOpenDetour}
          />
        </>
      )}

      {/* `detourId` exists before `stateOfDetourModal` does, so need this conditional
       * to ensure that either there's no `detourId` selected (i.e. make a new detour)
       * or the state has been successfully fetched from the api
       */}
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

const Title = ({ title }: { title: string }) => (
  <h2 className="fw-semibold fs-1 mt-3 mt-md-0 mb-3 mx-3 mx-md-0">{title}</h2>
)
