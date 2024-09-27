import React, { useCallback, useState } from "react"
import { DetoursTable, DetourStatus } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import {
  GlobeAmericas,
  LockFill,
  PeopleFill,
  PlusSquare,
  SvgProps,
} from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { fetchDetour, fetchDetours } from "../api"
import { useApiCall } from "../hooks/useApiCall"
import { isErr, isOk } from "../util/result"
import { isValidSnapshot } from "../util/isValidSnapshot"
import { createDetourMachine } from "../models/createDetourMachine"
import { joinClasses } from "../helpers/dom"

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const [detourId, setDetourId] = useState<number | undefined>()
  const { result } = useApiCall({
    apiCall: useCallback(async () => fetchDetours(), []),
  })
  const detours = result && isOk(result) && result.ok

  const { result: detour } = useApiCall({
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
      return detourResponse
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
          <Title
            title="Active detours"
            icon={GlobeAmericas}
            visibility="All Skate users"
            classNames={["d-flex"]}
          />
          <DetoursTable
            data={detours.active}
            status={DetourStatus.Active}
            onOpenDetour={onOpenDetour}
            classNames={["mb-5"]}
          />
          {userInTestGroup(TestGroups.DetoursPilot) && (
            <>
              <Title
                title="Draft detours"
                icon={LockFill}
                visibility="Only you"
                classNames={["u-hide-for-mobile", "d-md-flex"]}
              />
              <DetoursTable
                data={detours.draft}
                status={DetourStatus.Draft}
                onOpenDetour={onOpenDetour}
                classNames={["mb-5", "u-hide-for-mobile"]}
              />
              <Title
                title="Closed detours"
                icon={PeopleFill}
                visibility="Dispatchers and supervisors"
                classNames={["u-hide-for-mobile", "d-md-flex"]}
              />
              <DetoursTable
                data={detours.past}
                status={DetourStatus.Closed}
                onOpenDetour={onOpenDetour}
                classNames={["u-hide-for-mobile"]}
              />
            </>
          )}
        </>
      )}

      {/* `detourId` exists before `stateOfDetourModal` does, so need this conditional
       * to ensure that either there's no `detourId` selected (i.e. make a new detour)
       * or the state has been successfully fetched from the api
       */}
      {showDetourModal && (!detourId || detour) && (
        <DetourModal
          onClose={onCloseDetour}
          show
          originalRoute={{}}
          key={detourId ?? ""}
          {...(detour
            ? {
                snapshot: detour.ok.state,
                author: detour.ok.author,
                updatedAt: detour.ok.updatedAt,
              }
            : {})}
        />
      )}
    </div>
  )
}

const Title = (args: {
  title: string
  icon: (props: SvgProps) => React.JSX.Element
  visibility: string
  classNames?: string[]
}) => (
  <div
    className={joinClasses([
      ...(args.classNames || []),
      "mt-3",
      "mt-md-0",
      "mb-3",
      "mx-3",
      "mx-md-0",
    ])}
  >
    <h2 className="my-auto fw-semibold fs-1 me-3 text-nowrap">{args.title}</h2>
    <args.icon className="c-detour-list-page__header-icon my-auto me-1" />
    <span className="c-detour-list-page__header-visibility my-auto">
      {args.visibility}
    </span>
  </div>
)
